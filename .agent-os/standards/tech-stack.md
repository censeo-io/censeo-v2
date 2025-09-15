# Tech Stack

## Context

Global tech stack defaults for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

- App Framework: Django 5.1+
- Language: Python 3.12+
- Primary Database: PostgreSQL 16+
- ORM: Django ORM
- JavaScript Framework: React latest stable
- Build Tool: Vite
- Import Strategy: Node.js modules
- Package Manager: npm
- Node Version: 22 LTS
- CSS Framework: TailwindCSS 4.0+
- UI Components: Material-UI (MUI) or Ant Design
- UI Installation: Via npm packages
- Font Provider: Google Fonts
- Font Loading: Self-hosted for performance
- Icons: Lucide React components
- Application Hosting: Google Cloud Run or App Engine
- Hosting Region: Primary region based on user base
- Database Hosting: Google Cloud SQL PostgreSQL
- Database Backups: Daily automated via Cloud SQL
- Asset Storage: Google Cloud Storage
- CDN: Google Cloud CDN
- Asset Access: Private with signed URLs
- CI/CD Platform: Google Cloud Build or GitHub Actions
- CI/CD Trigger: Push to main/staging branches
- Tests: Run before deployment
- Production Environment: main branch
- Staging Environment: staging branch
