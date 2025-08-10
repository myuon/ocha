#!/bin/bash

# Deploy Ocha to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"asia-northeast1"}
SERVICE_NAME="ocha"

echo "🚀 Deploying Ocha to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️  Building and deploying..."
gcloud builds submit --config cloudbuild.yaml

# Update environment variables if env-vars.prod.yaml exists
if [ -f "deploy/env-vars.prod.yaml" ]; then
    echo "🔧 Updating environment variables..."
    gcloud run services update $SERVICE_NAME \
        --env-vars-file deploy/env-vars.prod.yaml \
        --region $REGION
else
    echo "⚠️  No deploy/env-vars.prod.yaml found. Please create it with your environment variables."
    echo "   Copy deploy/env-vars.yaml and set your actual values."
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo
echo "✅ Deployment completed!"
echo "🌐 Service URL: $SERVICE_URL"
echo
echo "📋 Next steps:"
echo "1. Set up your environment variables by copying deploy/env-vars.yaml to deploy/env-vars.prod.yaml"
echo "2. Update the environment variables: gcloud run services update $SERVICE_NAME --env-vars-file deploy/env-vars.prod.yaml --region $REGION"
echo "3. Configure your Google OAuth2 authorized origins and redirect URIs to include: $SERVICE_URL"
echo
echo "🔧 Monitor your deployment:"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"