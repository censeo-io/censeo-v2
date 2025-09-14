# Technical Stack

> **⚙️ Original Documentation**: See [original-engineering-standards.md](./original-engineering-standards.md) for complete engineering practices and standards

## Application Framework
**Node.js v18+ with TypeScript + Express**
- Backend REST API and Socket.IO server
- TypeScript strict mode for type safety
- Express.js for HTTP routing and middleware

## Database System
**PostgreSQL on Google Cloud SQL**
- Relational database for structured data
- ACID compliance for critical voting data
- Built-in backup and high availability

## JavaScript Framework
**React with Next.js 14+ (App Router)**
- Component-based frontend framework with server-side rendering
- TypeScript integration for type safety
- App Router for simplified routing and layouts

## Import Strategy
**Node.js (ES Modules)**
- Native ES module support
- Tree-shaking for optimal bundle sizes
- Standard Node.js module resolution

## CSS Framework
**Tailwind CSS + shadcn/ui**
- Utility-first CSS framework for rapid development
- shadcn/ui component library with accessibility built-in
- Consistent design system with customizable themes
- Custom components for application-specific UI

## UI Component Library
**shadcn/ui + Custom React Components**
- shadcn/ui components built on Radix UI primitives
- Custom React components for story pointing workflows
- Accessibility features and keyboard navigation built-in

## Fonts Provider
**Google Fonts (Inter)**
- Inter font family for excellent readability
- Variable font support for performance
- Self-hosted for privacy compliance

## Icon Library
**Lucide React Icons**
- Modern icon set with React components
- Tree-shakable icon imports
- Accessible SVG icons optimized for web

## Application Hosting
**Google Cloud Run**
- Containerized serverless deployment
- Auto-scaling based on traffic
- Zero-downtime rolling deployments

## Database Hosting
**Google Cloud SQL (PostgreSQL)**
- Managed PostgreSQL service
- Automatic backups and failover
- Connection pooling support

## Asset Hosting
**Google Cloud Run (Static Assets)**
- Static assets served from same container
- CDN caching via Cloud Load Balancer
- Integrated with application deployment

## Deployment Solution
**Google Cloud Build + Cloud Run**
- CI/CD pipeline with Cloud Build
- Docker containerization
- Environment-specific deployments (dev/staging/prod)

## Code Repository URL
**GitHub Repository**
- Version control with Git
- GitHub Actions for CI/CD workflows
- Issue tracking and project management

## Additional Infrastructure

### Real-Time Communication
**Socket.IO v4+**
- WebSocket-based real-time communication
- Automatic reconnection and fallback transports
- Room-based event distribution

### Authentication
**Magic Links (JWT-based)**
- Passwordless authentication system
- JWT tokens for session management
- Google Secret Manager for token signing keys

### Secret Management
**Google Secret Manager**
- Centralized secret storage
- Environment-specific secret versions
- Integration with Cloud Run

### Monitoring & Logging
**Google Cloud Operations Suite**
- Application monitoring and alerting
- Structured logging with Winston
- Performance and error tracking

### Testing Framework
**Jest + React Testing Library + Playwright**
- Jest for backend unit/integration tests
- React Testing Library for component tests
- Playwright for end-to-end testing

### Code Quality
**ESLint + Prettier + SonarCloud**
- ESLint for code quality rules
- Prettier for consistent formatting
- SonarCloud for security and maintainability analysis

### Development Environment
**Docker + Docker Compose**
- Local development with containers
- PostgreSQL and Redis for local testing
- Hot reload for development efficiency