# Tech Stack

## Context

Tech stack for Story Pointing Application - secure, real-time collaborative tool for agile teams.

## Backend
- App Framework: Node.js with Express
- Language: TypeScript (strict mode)
- Primary Database: PostgreSQL on Google Cloud SQL
- ORM/Query Builder: Prisma or raw SQL with parameterized queries
- Real-time Communication: Socket.IO with auto-reconnection
- Authentication: Magic links (JWT tokens)
- Secret Management: Google Secret Manager

## Frontend
- JavaScript Framework: React with Next.js 14+ (TypeScript)
- Build Tool: Vite
- Package Manager: npm
- Node Version: 22 LTS
- CSS Framework: Tailwind CSS + shadcn/ui components
- Icons: Lucide React Icons
- Font Provider: Google Fonts
- Font Loading: Self-hosted for performance

## Infrastructure & Hosting
- Application Hosting: Google Cloud Run
- Database Hosting: Google Cloud SQL (PostgreSQL)
- Database Backups: Daily automated via Cloud SQL
- Monitoring: Google Cloud built-in monitoring + logging
- Secret Management: Google Secret Manager
- Region: Based on primary user base

## Development & CI/CD
- CI/CD Platform: GitHub Actions
- Code Quality: SonarCloud (free for public repos)
- Testing Framework: Jest/Vitest + React Testing Library + Playwright
- Load Testing: Artillery or k6
- CI/CD Trigger: Push to main/staging branches
- Tests: All test suites run before deployment
- Deployment Strategy: Zero-downtime rolling deployments via Cloud Run
- Production Environment: main branch
- Staging Environment: staging branch

## Security & Configuration
- Rate Limiting: Configurable limits via environment variables
- Input Validation: All API endpoints
- Configuration: 12-factor methodology with env vars
- Dependencies: Regular security scanning via SonarCloud
