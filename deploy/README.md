# Cloud Run Deployment Guide

This directory contains the necessary files to deploy the Ocha application to Google Cloud Run.

## Prerequisites

1. **Google Cloud CLI**: Install and authenticate with gcloud
   ```bash
   # Install gcloud CLI
   # https://cloud.google.com/sdk/docs/install
   
   # Authenticate
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Google Cloud Project**: Create a project and enable billing
   ```bash
   # Create a new project (optional)
   gcloud projects create your-project-id
   
   # Set the active project
   gcloud config set project your-project-id
   ```

3. **Required APIs**: The deployment script will enable these automatically
   - Cloud Build API
   - Cloud Run API
   - Container Registry API

## Quick Deployment

### Method 1: Using Makefile (Recommended)

1. **Setup project and APIs**:
   ```bash
   make deploy-setup PROJECT_ID=your-project-id
   ```

2. **First-time setup** (run only once per project):
   ```bash
   make setup-first-time PROJECT_ID=your-project-id
   ```

3. **Deploy the application**:
   ```bash
   make deploy PROJECT_ID=your-project-id
   ```

### Method 2: Using the deployment script

1. **Run the deployment script**:
   ```bash
   ./deploy/deploy.sh your-project-id asia-northeast1
   ```

2. **Configure environment variables**:
   ```bash
   # Copy the template
   cp deploy/env-vars.yaml deploy/env-vars.prod.yaml
   
   # Edit with your actual values
   nano deploy/env-vars.prod.yaml
   
   # Update the service
   make deploy-env
   ```

### Method 3: Manual deployment

1. **Build and push the Docker image**:
   ```bash
   # Build the image
   docker build -t gcr.io/your-project-id/ocha:latest .
   
   # Push to Google Container Registry
   docker push gcr.io/your-project-id/ocha:latest
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy ocha \
     --image gcr.io/your-project-id/ocha:latest \
     --region asia-northeast1 \
     --platform managed \
     --allow-unauthenticated \
     --port 3000 \
     --memory 1Gi \
     --cpu 1 \
     --max-instances 10
   ```

3. **Set environment variables**:
   ```bash
   gcloud run services update ocha \
     --set-env-vars OPENAI_API_KEY=your-key,GOOGLE_CLIENT_ID=your-client-id \
     --region asia-northeast1
   ```

### Method 4: Using Cloud Build

```bash
# Submit to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Update environment variables
gcloud run services update ocha \
  --env-vars-file deploy/env-vars.prod.yaml \
  --region asia-northeast1
```

## Environment Variables

### Required Variables

- `OPENAI_API_KEY`: Your OpenAI API key for AI chat functionality
- `GOOGLE_CLIENT_ID`: Google OAuth2 client ID for authentication

### Optional Variables

- `AVAILABLE_USERS`: Comma-separated list of allowed email addresses (e.g., `admin@company.com,user@company.com`)
- `NODE_ENV`: Set to `production` (automatically set in deployment)
- `PORT`: Port number (automatically set to 3000 for Cloud Run)

## Google OAuth2 Setup

After deployment, configure your Google OAuth2 settings:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth2 client ID
3. Add your Cloud Run URL to:
   - **Authorized JavaScript origins**: `https://your-service-url`
   - **Authorized redirect URIs**: `https://your-service-url` (if needed)

## Monitoring and Troubleshooting

### View logs
```bash
gcloud run services logs tail ocha --region asia-northeast1
```

### Check service status
```bash
gcloud run services describe ocha --region asia-northeast1
```

### Update the service
```bash
# Update image
gcloud run services update ocha --image gcr.io/your-project-id/ocha:latest --region asia-northeast1

# Update environment variables
gcloud run services update ocha --env-vars-file deploy/env-vars.prod.yaml --region asia-northeast1

# Update resources
gcloud run services update ocha --memory 2Gi --cpu 2 --region asia-northeast1
```

## Security Considerations

1. **Environment Variables**: Use Google Secret Manager for sensitive data in production
2. **Access Control**: Configure IAM properly and consider using Cloud Run's built-in authentication
3. **HTTPS**: Cloud Run provides HTTPS by default
4. **User Restrictions**: Use the `AVAILABLE_USERS` environment variable to limit access

## Cost Optimization

- Cloud Run is pay-per-use with a generous free tier
- The service scales to zero when not in use
- Adjust `--memory` and `--cpu` based on your needs
- Set `--max-instances` to control maximum scaling

## Files in this directory

- `deploy.sh`: Automated deployment script
- `env-vars.yaml`: Environment variables template
- `service.yaml`: Cloud Run service configuration
- `cloudbuild.yaml`: Cloud Build configuration (in project root)
- `README.md`: This documentation