import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

/**
 * Global setup runs once before all tests
 *
 * This is where we reset the database to ensure a clean state.
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Running global setup...');

  // Check if Docker services are running
  try {
    const output = execSync('docker-compose ps --services --filter "status=running"', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    const runningServices = output.trim().split('\n').filter(s => s);

    if (!runningServices.includes('backend') || !runningServices.includes('frontend')) {
      console.error('❌ Docker services not running. Please run: docker-compose up');
      process.exit(1);
    }

    console.log('✅ Docker services are running');
  } catch (error) {
    console.error('❌ Failed to check Docker services:', error);
    process.exit(1);
  }

  // Reset the database using Django management command
  try {
    console.log('🗄️  Resetting database...');

    execSync('docker-compose exec -T backend python manage.py flush --no-input', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    console.error('Note: If this fails, ensure the backend container is running and migrations are applied');
    // Don't exit - tests might still work with existing data
  }

  // Verify services are responding
  try {
    console.log('🔍 Verifying services...');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Check frontend
    const frontendResponse = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!frontendResponse || !frontendResponse.ok()) {
      throw new Error('Frontend not responding');
    }

    // Check backend
    const backendResponse = await page.goto('http://localhost:8000/api/health/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!backendResponse || !backendResponse.ok()) {
      console.warn('⚠️  Backend health check failed - tests may fail');
    }

    await browser.close();

    console.log('✅ Services verified');
  } catch (error) {
    console.error('❌ Service verification failed:', error);
    console.error('Ensure both frontend and backend are running and responsive');
    process.exit(1);
  }

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
