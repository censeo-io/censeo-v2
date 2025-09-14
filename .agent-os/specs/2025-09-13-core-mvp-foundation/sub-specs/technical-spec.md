# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-13-core-mvp-foundation/spec.md

> Created: 2025-09-13
> Version: 1.0.0

## Technical Requirements

### Core Infrastructure Stack

- **Platform**: Google Cloud Platform (GCP)
- **Compute**: Cloud Run (serverless containers)
- **Database**: Cloud SQL (PostgreSQL 15)
- **Storage**: Cloud Storage buckets
- **CDN**: Cloud CDN
- **Load Balancing**: Cloud Load Balancer
- **DNS**: Cloud DNS
- **Monitoring**: Cloud Monitoring + Cloud Logging
- **Secret Management**: Secret Manager
- **CI/CD**: Cloud Build + GitHub Actions

### Application Framework

- **Backend**: Node.js 20+ with Express.js
- **Frontend**: Next.js 14+ with TypeScript
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js
- **CSS Framework**: Tailwind CSS
- **UI Components**: shadcn/ui

## Approach

### 1. Google Cloud Platform Setup

#### Initial GCP Project Setup
```bash
# Create new GCP project
gcloud projects create censeo --name="Censeo"

# Set project as default
gcloud config set project censeo

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sql-component.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  dns.googleapis.com \
  cdn.googleapis.com
```

#### Service Account Configuration
```bash
# Create service account for Cloud Run
gcloud iam service-accounts create censeo-app-service \
  --display-name="Censeo Application Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding censeo \
  --member="serviceAccount:censeo-app-service@censeo.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding censeo \
  --member="serviceAccount:censeo-app-service@censeo.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding censeo \
  --member="serviceAccount:censeo-app-service@censeo.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

### 2. Multi-Environment Configuration

#### Environment Structure
- **Staging**: `censeo-staging` (Cloud Run service)
- **Production**: `censeo-prod` (Cloud Run service)

#### Database Setup Per Environment
```bash
# Note: Local development uses Docker PostgreSQL container

# Staging database
gcloud sql instances create censeo-db-staging \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1

# Production database
gcloud sql instances create censeo-db-prod \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1 \
  --availability-type=REGIONAL
```

#### Storage Buckets Per Environment
```bash
# Note: Local development uses local file storage

# Staging storage
gsutil mb gs://censeo-storage-staging

# Production storage
gsutil mb gs://censeo-storage-prod
```

### 3. Local Development Setup

#### Docker Configuration

**Dockerfile**
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=local
      - DATABASE_URL=postgresql://postgres:password@db:5432/censeo_dev
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=local-secret-key
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: censeo_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Local Development Scripts

**package.json scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

### 4. CI/CD Pipeline Configuration

#### GitHub Actions Workflow

**.github/workflows/deploy.yml**
```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches:
      - main
      - develop
      - staging

jobs:
  deploy:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        include:
          - branch: develop
            environment: dev
            service_name: censeo-dev
          - branch: staging
            environment: staging
            service_name: censeo-staging
          - branch: main
            environment: prod
            service_name: censeo-prod

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test

    - name: Run linting
      run: npm run lint

    - name: Build application
      run: npm run build

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v2
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v2

    - name: Configure Docker to use gcloud
      run: gcloud auth configure-docker

    - name: Build and push Docker image
      run: |
        docker build -t gcr.io/censeo/${{ matrix.service_name }}:${{ github.sha }} .
        docker push gcr.io/censeo/${{ matrix.service_name }}:${{ github.sha }}

    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy ${{ matrix.service_name }} \
          --image gcr.io/censeo/${{ matrix.service_name }}:${{ github.sha }} \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated \
          --service-account censeo-app-service@censeo.iam.gserviceaccount.com \
          --set-env-vars NODE_ENV=${{ matrix.environment }} \
          --set-secrets DATABASE_URL=database-url-${{ matrix.environment }}:latest \
          --set-secrets NEXTAUTH_SECRET=nextauth-secret-${{ matrix.environment }}:latest
```

#### Cloud Build Configuration

**cloudbuild.yaml**
```yaml
steps:
  # Install dependencies
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['ci']

  # Run tests
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['run', 'test']

  # Build application
  - name: 'node:20'
    entrypoint: 'npm'
    args: ['run', 'build']

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/$PROJECT_ID/${_SERVICE_NAME}:${SHORT_SHA}',
      '-t', 'gcr.io/$PROJECT_ID/${_SERVICE_NAME}:latest',
      '.'
    ]

  # Push Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', 'gcr.io/$PROJECT_ID/${_SERVICE_NAME}']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: [
      'run', 'deploy', '${_SERVICE_NAME}',
      '--image', 'gcr.io/$PROJECT_ID/${_SERVICE_NAME}:${SHORT_SHA}',
      '--region', '${_REGION}',
      '--platform', 'managed',
      '--allow-unauthenticated',
      '--service-account', 'censeo-app-service@$PROJECT_ID.iam.gserviceaccount.com'
    ]

substitutions:
  _SERVICE_NAME: 'censeo-app'
  _REGION: 'us-central1'

options:
  logging: CLOUD_LOGGING_ONLY
```

### 5. Security and Secret Management

#### Secret Manager Setup
```bash
# Database URLs
gcloud secrets create database-url-dev --data-file=database-url-dev.txt
gcloud secrets create database-url-staging --data-file=database-url-staging.txt
gcloud secrets create database-url-prod --data-file=database-url-prod.txt

# NextAuth secrets
gcloud secrets create nextauth-secret-dev --data-file=nextauth-secret-dev.txt
gcloud secrets create nextauth-secret-staging --data-file=nextauth-secret-staging.txt
gcloud secrets create nextauth-secret-prod --data-file=nextauth-secret-prod.txt

# OAuth secrets
gcloud secrets create google-oauth-client-id --data-file=google-oauth-client-id.txt
gcloud secrets create google-oauth-client-secret --data-file=google-oauth-client-secret.txt
```

#### Environment Variables Configuration

**Local Development (.env.local)**
```bash
NODE_ENV=local
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/censeo_dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-secret-key
```

**Production (Secret Manager)**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.censeo.com
DATABASE_URL=[SECRET_MANAGER_REFERENCE]
NEXTAUTH_URL=https://app.censeo.com
NEXTAUTH_SECRET=[SECRET_MANAGER_REFERENCE]
```

### 6. Monitoring and Logging Setup

#### Cloud Monitoring Configuration
```bash
# Create uptime check for production
gcloud alpha monitoring uptime create \
  --display-name="Censeo Production Health Check" \
  --http-check-path="/api/health" \
  --monitored-resource-type="url_monitored" \
  --monitored-resource-labels="host=app.censeo.com"

# Create alert policy for high error rates
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring-policy.json
```

#### Logging Configuration

**logger.ts**
```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'censeo-app' },
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? format.json()
        : format.simple()
    })
  ]
});

export default logger;
```

#### Health Check Endpoint

**pages/api/health.ts**
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
```

### 7. Database Management

#### Prisma Configuration

**prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

#### Migration Scripts
```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Run migrations locally
npx prisma migrate dev --name init

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (local only)
npx prisma migrate reset
```

## External Dependencies

### Core Dependencies
- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type safety and developer experience
- **Prisma**: Database ORM and migrations
- **NextAuth.js**: Authentication solution
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Zod**: Runtime type validation
- **React Hook Form**: Form handling

### Local Development Dependencies
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Testing Library**: React testing utilities
- **TypeScript**: Static type checking
- **Prisma Studio**: Database GUI

### Infrastructure Dependencies
- **Google Cloud SDK**: GCP CLI tools
- **Docker**: Containerization
- **Cloud SQL Proxy**: Local database connection
- **Node.js 20**: Runtime environment

### Production Dependencies
- **Cloud Run**: Serverless container hosting
- **Cloud SQL**: Managed PostgreSQL
- **Secret Manager**: Secure configuration
- **Cloud Storage**: File storage
- **Cloud CDN**: Content delivery
- **Cloud Monitoring**: Application monitoring
- **Cloud Logging**: Centralized logging

### Security Dependencies
- **NextAuth.js**: OAuth integration
- **bcryptjs**: Password hashing (if needed)
- **helmet**: Security headers
- **rate-limiter-flexible**: Rate limiting
- **cors**: Cross-origin resource sharing

This technical specification provides a complete foundation for building and deploying the Censeo MVP with proper separation of concerns, security best practices, and scalable architecture patterns.