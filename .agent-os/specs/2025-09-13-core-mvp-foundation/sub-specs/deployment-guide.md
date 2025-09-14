# Deployment and Environment Setup Guide

This is the deployment and environment setup guide for the spec detailed in @.agent-os/specs/2025-09-13-core-mvp-foundation/spec.md

> Created: 2025-09-13
> Version: 1.0.0
> Status: Implementation Ready

## Overview

This guide provides comprehensive instructions for setting up production-ready infrastructure from scratch, including Google Cloud Platform setup, containerized environments, CI/CD pipelines, and monitoring.

## Prerequisites

- Google Cloud Platform account with billing enabled
- GitHub account with repository access
- Domain name for production deployment
- Local development machine with admin privileges

## 1. Google Cloud Platform Setup

### 1.1 Initial GCP Configuration

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize and authenticate
gcloud init
gcloud auth login
gcloud auth application-default login

# Create new project
export PROJECT_ID="censeo-$(date +%s)"
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# Enable billing (replace BILLING_ACCOUNT_ID with your billing account)
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

### 1.2 Enable Required APIs

```bash
# Enable essential APIs
gcloud services enable \
  compute.googleapis.com \
  container.googleapis.com \
  cloudsql.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  cloudfunctions.googleapis.com \
  storage.googleapis.com
```

### 1.3 Set Up GKE Cluster

```bash
# Set variables
export CLUSTER_NAME="censeo-cluster"
export REGION="us-central1"
export ZONE="us-central1-a"

# Create GKE cluster
gcloud container clusters create $CLUSTER_NAME \
  --region=$REGION \
  --node-locations=$ZONE \
  --num-nodes=2 \
  --machine-type=e2-medium \
  --disk-size=50GB \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --enable-autorepair \
  --enable-autoupgrade \
  --maintenance-window-start="2023-01-01T09:00:00Z" \
  --maintenance-window-end="2023-01-01T17:00:00Z" \
  --maintenance-window-recurrence="FREQ=WEEKLY;BYDAY=SA,SU"

# Get cluster credentials
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION
```

### 1.4 Set Up Cloud SQL Database

```bash
# Create Cloud SQL instance
export DB_INSTANCE_NAME="censeo-db"
export DB_PASSWORD="$(openssl rand -base64 32)"

gcloud sql instances create $DB_INSTANCE_NAME \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=$DB_PASSWORD \
  --storage-size=10GB \
  --storage-type=SSD \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --maintenance-release-channel=production

# Create application database
gcloud sql databases create censeo --instance=$DB_INSTANCE_NAME

# Store database password in Secret Manager
echo -n $DB_PASSWORD | gcloud secrets create db-password --data-file=-
```

### 1.5 Container Registry Setup

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Create repository in Artifact Registry (recommended over Container Registry)
gcloud artifacts repositories create censeo-repo \
  --repository-format=docker \
  --location=$REGION
```

## 2. Local Development Environment

### 2.1 Docker Development Setup

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=local
      - DATABASE_URL=postgresql://postgres:password@db:5432/censeo_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=censeo_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
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

Create `Dockerfile.dev`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### 2.2 Development Scripts

Create `scripts/dev-setup.sh`:

```bash
#!/bin/bash
set -e

echo "Setting up local development environment..."

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "Docker is required. Please install Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is required."
    exit 1
fi

# Create environment file
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "Created .env.local - please update with your local settings"
fi

# Start services
docker-compose up -d db redis

# Wait for database
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
docker-compose run --rm app npm run db:migrate

# Seed database
docker-compose run --rm app npm run db:seed

echo "Development environment ready! Run 'npm run dev' to start."
```

## 3. Multi-Environment Configuration

### 3.1 Environment Structure

```
environments/
├── local/
│   ├── docker/
│   └── terraform/
├── staging/
│   ├── k8s/
│   └── terraform/
└── production/
    ├── k8s/
    └── terraform/
```

### 3.2 Kubernetes Configurations

Create `environments/production/k8s/app-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: censeo-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: censeo-app
  template:
    metadata:
      labels:
        app: censeo-app
    spec:
      containers:
      - name: app
        image: gcr.io/PROJECT_ID/censeo-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 3.3 Terraform Infrastructure

Create `environments/production/terraform/main.tf`:

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
  backend "gcs" {
    bucket = "censeo-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Resources
resource "google_storage_bucket" "app_storage" {
  name     = "${var.project_id}-app-storage"
  location = var.region

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}
```

## 4. CI/CD Pipeline with GitHub Actions

### 4.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GKE_CLUSTER: censeo-cluster
  GKE_ZONE: us-central1-a
  IMAGE: censeo-app

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        export_default_credentials: true

    - name: Configure Docker
      run: gcloud --quiet auth configure-docker

    - name: Get GKE credentials
      run: gcloud container clusters get-credentials "$GKE_CLUSTER" --zone "$GKE_ZONE"

    - name: Build Docker image
      run: |
        docker build -t "gcr.io/$PROJECT_ID/$IMAGE:$GITHUB_SHA" .
        docker build -t "gcr.io/$PROJECT_ID/$IMAGE:latest" .

    - name: Push Docker image
      run: |
        docker push "gcr.io/$PROJECT_ID/$IMAGE:$GITHUB_SHA"
        docker push "gcr.io/$PROJECT_ID/$IMAGE:latest"

    - name: Set environment
      run: |
        if [ "$GITHUB_REF" = "refs/heads/main" ]; then
          echo "ENVIRONMENT=production" >> $GITHUB_ENV
        else
          echo "ENVIRONMENT=staging" >> $GITHUB_ENV
        fi

    - name: Deploy to GKE
      run: |
        envsubst < environments/$ENVIRONMENT/k8s/app-deployment.yaml | kubectl apply -f -
        kubectl rollout status deployment/censeo-app -n $ENVIRONMENT
        kubectl get services -o wide -n $ENVIRONMENT
```

### 4.2 Production Dockerfile

Create optimized production `Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

## 5. Secret Management Configuration

### 5.1 Google Secret Manager Setup

```bash
# Store application secrets
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-api-key" | gcloud secrets create api-key --data-file=-

# Create service account for secret access
gcloud iam service-accounts create secret-accessor \
  --description="Service account for accessing secrets" \
  --display-name="Secret Accessor"

# Grant secret accessor permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:secret-accessor@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5.2 Kubernetes Secret Integration

Create `scripts/sync-secrets.sh`:

```bash
#!/bin/bash
set -e

NAMESPACE=${1:-production}
PROJECT_ID=$(gcloud config get-value project)

echo "Syncing secrets to $NAMESPACE namespace..."

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Sync secrets from Google Secret Manager
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")
JWT_SECRET=$(gcloud secrets versions access latest --secret="jwt-secret")
API_KEY=$(gcloud secrets versions access latest --secret="api-key")

# Create Kubernetes secret
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://postgres:$DB_PASSWORD@$DB_INSTANCE_NAME:5432/censeo" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=api-key="$API_KEY" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secrets synced successfully to $NAMESPACE namespace"
```

## 6. Domain Setup and SSL Certificates

### 6.1 Domain Configuration

```bash
# Reserve static IP address
gcloud compute addresses create censeo-ip --global

# Get the IP address
gcloud compute addresses describe censeo-ip --global --format="value(address)"

# Configure your domain's A record to point to this IP
```

### 6.2 SSL Certificate Setup

Create `environments/production/k8s/ingress.yaml`:

```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: censeo-ssl-cert
  namespace: production
spec:
  domains:
    - censeo.com
    - www.censeo.com
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: censeo-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.global-static-ip-name: censeo-ip
    networking.gke.io/managed-certificates: censeo-ssl-cert
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
  - host: censeo.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: censeo-service
            port:
              number: 80
  - host: www.censeo.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: censeo-service
            port:
              number: 80
```

## 7. Monitoring and Alerting Configuration

### 7.1 Google Cloud Monitoring Setup

Create `monitoring/alerts.yaml`:

```yaml
# Application uptime monitoring
displayName: "Application Uptime"
conditions:
  - displayName: "Application is down"
    conditionThreshold:
      filter: 'resource.type="gke_container"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0.1
      duration: "300s"
alertPolicy:
  notificationChannels:
    - projects/PROJECT_ID/notificationChannels/EMAIL_CHANNEL_ID
```

### 7.2 Logging Configuration

Create `scripts/setup-logging.sh`:

```bash
#!/bin/bash

# Create log-based metrics
gcloud logging metrics create error_rate \
  --description="Application error rate" \
  --log-filter='resource.type="gke_container" AND severity>=ERROR'

# Create alerting policy for high error rate
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring/error-rate-policy.yaml
```

### 7.3 Application Health Checks

Add to your application code:

```javascript
// health.js
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');

    // Check Redis connection
    await redis.ping();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/ready', async (req, res) => {
  // Readiness check - more strict than health check
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

## 8. Backup and Disaster Recovery

### 8.1 Database Backup Strategy

```bash
# Automated backups are enabled by default for Cloud SQL
# Create additional backup policy
gcloud sql backup-runs create \
  --instance=$DB_INSTANCE_NAME \
  --description="Manual backup before deployment"

# Create backup retention policy
gcloud sql instances patch $DB_INSTANCE_NAME \
  --backup-start-time=02:00 \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7
```

### 8.2 Application Data Backup

Create `scripts/backup-app-data.sh`:

```bash
#!/bin/bash
set -e

BACKUP_BUCKET="censeo-backups-$(date +%Y%m%d)"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup bucket if it doesn't exist
gsutil mb -p $PROJECT_ID gs://$BACKUP_BUCKET || true

# Backup application files
kubectl exec -n production deployment/censeo-app -- tar czf /tmp/app-backup-$DATE.tar.gz /app/uploads
kubectl cp production/$(kubectl get pods -n production -l app=censeo-app -o jsonpath='{.items[0].metadata.name}'):/tmp/app-backup-$DATE.tar.gz ./app-backup-$DATE.tar.gz

# Upload to Google Cloud Storage
gsutil cp app-backup-$DATE.tar.gz gs://$BACKUP_BUCKET/

# Clean up local file
rm app-backup-$DATE.tar.gz

echo "Backup completed: gs://$BACKUP_BUCKET/app-backup-$DATE.tar.gz"
```

### 8.3 Disaster Recovery Plan

Create `docs/disaster-recovery.md`:

```markdown
# Disaster Recovery Procedures

## RTO/RPO Targets
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour

## Recovery Procedures

### 1. Database Recovery
```bash
# Restore from backup
gcloud sql backups restore BACKUP_ID --restore-instance=censeo-db-restored
```

### 2. Application Recovery
```bash
# Redeploy application
kubectl apply -f environments/production/k8s/
```

### 3. DNS Failover
Update DNS records to point to backup region if needed.
```

## 9. Maintenance and Scaling Considerations

### 9.1 Horizontal Pod Autoscaling

Create `environments/production/k8s/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: censeo-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: censeo-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 9.2 Database Scaling

```bash
# Scale up database instance
gcloud sql instances patch $DB_INSTANCE_NAME \
  --tier=db-custom-2-4096 \
  --storage-size=100GB

# Create read replicas for scaling reads
gcloud sql instances create $DB_INSTANCE_NAME-replica \
  --master-instance-name=$DB_INSTANCE_NAME \
  --tier=db-custom-1-3840 \
  --replica-type=READ
```

### 9.3 Cluster Scaling

```bash
# Scale node pool
gcloud container clusters resize $CLUSTER_NAME \
  --num-nodes=5 \
  --region=$REGION

# Enable cluster autoscaling
gcloud container clusters update $CLUSTER_NAME \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=10 \
  --region=$REGION
```

### 9.4 Maintenance Scripts

Create `scripts/maintenance.sh`:

```bash
#!/bin/bash
set -e

case $1 in
  "update-secrets")
    ./scripts/sync-secrets.sh production
    kubectl rollout restart deployment/censeo-app -n production
    ;;
  "backup")
    ./scripts/backup-app-data.sh
    ;;
  "scale-up")
    kubectl scale deployment/censeo-app --replicas=10 -n production
    ;;
  "scale-down")
    kubectl scale deployment/censeo-app --replicas=3 -n production
    ;;
  *)
    echo "Usage: $0 {update-secrets|backup|scale-up|scale-down}"
    exit 1
    ;;
esac
```

## 10. Troubleshooting Common Issues

### 10.1 Application Issues

**Pod Crashes or Won't Start:**
```bash
# Check pod status
kubectl get pods -n production

# Check logs
kubectl logs -f deployment/censeo-app -n production

# Describe pod for events
kubectl describe pod POD_NAME -n production

# Check resource usage
kubectl top pods -n production
```

**Database Connection Issues:**
```bash
# Test database connectivity
kubectl exec -it deployment/censeo-app -n production -- npm run db:test

# Check Cloud SQL instance status
gcloud sql instances describe $DB_INSTANCE_NAME

# Verify secrets are properly mounted
kubectl get secret app-secrets -n production -o yaml
```

### 10.2 Infrastructure Issues

**SSL Certificate Problems:**
```bash
# Check managed certificate status
kubectl describe managedcertificate censeo-ssl-cert -n production

# Check ingress status
kubectl describe ingress censeo-ingress -n production

# Verify DNS configuration
nslookup censeo.com 8.8.8.8
```

**Performance Issues:**
```bash
# Check HPA status
kubectl get hpa -n production

# Monitor resource usage
kubectl top nodes
kubectl top pods -n production

# Check application metrics in Google Cloud Console
gcloud logging read "resource.type=gke_container" --limit=50
```

### 10.3 CI/CD Pipeline Issues

**Build Failures:**
```bash
# Check GitHub Actions logs
# Verify service account permissions
gcloud projects get-iam-policy $PROJECT_ID

# Test local build
docker build -t test-image .
```

**Deployment Failures:**
```bash
# Check rollout status
kubectl rollout status deployment/censeo-app -n production

# Rollback if needed
kubectl rollout undo deployment/censeo-app -n production

# Check deployment history
kubectl rollout history deployment/censeo-app -n production
```

## Quick Start Checklist

- [ ] GCP project created and billing enabled
- [ ] Required APIs enabled
- [ ] GKE cluster created and configured
- [ ] Cloud SQL instance created
- [ ] Container registry configured
- [ ] Local development environment set up
- [ ] Multi-environment configurations deployed
- [ ] CI/CD pipeline configured and tested
- [ ] Secrets properly managed
- [ ] Domain and SSL certificates configured
- [ ] Monitoring and alerting set up
- [ ] Backup procedures tested
- [ ] Team trained on maintenance procedures

## Security Best Practices

1. **Principle of Least Privilege**: Grant minimal necessary permissions
2. **Secret Rotation**: Regularly rotate database passwords and API keys
3. **Network Security**: Use private clusters and restrict IP ranges
4. **Container Security**: Regularly update base images and scan for vulnerabilities
5. **Access Controls**: Use IAM roles and Kubernetes RBAC
6. **Audit Logging**: Enable and monitor audit logs
7. **Encryption**: Ensure data is encrypted in transit and at rest

## Cost Optimization

1. **Right-sizing**: Monitor and adjust resource allocations
2. **Auto-scaling**: Use HPA and cluster autoscaling
3. **Committed Use Discounts**: Consider GCP committed use for stable workloads
4. **Storage Classes**: Use appropriate storage classes for different data types
5. **Development Environments**: Shut down non-production environments when not in use
6. **Monitoring**: Set up billing alerts and cost monitoring

This guide provides a complete foundation for deploying and maintaining a production-ready application on Google Cloud Platform with proper DevOps practices, security, and scalability considerations.