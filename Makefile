# Ocha - Cloud Run Deployment Makefile
.PHONY: help build deploy deploy-full test clean docker-build docker-run

# Default project settings
PROJECT_ID ?= your-project-id
REGION ?= asia-northeast1
SERVICE_NAME ?= ocha

help: ## Show this help message
	@echo "Ocha Cloud Run Deployment"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the application locally
	npm run build

test: ## Run tests and linting
	npm run check
	npm run build

docker-build: ## Build Docker image locally
	docker build -t $(SERVICE_NAME):latest .

docker-run: ## Run Docker container locally
	docker run -p 3000:3000 --env-file .env $(SERVICE_NAME):latest

clean: ## Clean build artifacts
	rm -rf apps/*/dist
	rm -rf apps/*/node_modules
	rm -rf node_modules

# Cloud Run deployment commands
deploy-setup: ## Setup GCloud project and enable APIs
	gcloud config set project $(PROJECT_ID)
	gcloud services enable cloudbuild.googleapis.com
	gcloud services enable run.googleapis.com
	gcloud services enable containerregistry.googleapis.com
	gcloud services enable artifactregistry.googleapis.com

# First-time setup commands (run only once per project)
setup-artifact-registry: ## Create Artifact Registry repository
	@echo "Creating Artifact Registry repository..."
	gcloud artifacts repositories create $(SERVICE_NAME) \
		--repository-format=docker \
		--location=$(REGION) \
		--project=$(PROJECT_ID)

setup-permissions: ## Setup Cloud Build service account permissions
	@echo "Setting up Cloud Build service account permissions..."
	$(eval CLOUDBUILD_SA := $(shell gcloud projects describe $(PROJECT_ID) --format="value(projectNumber)")@cloudbuild.gserviceaccount.com)
	gcloud projects add-iam-policy-binding $(PROJECT_ID) \
		--member="serviceAccount:$(CLOUDBUILD_SA)" \
		--role="roles/artifactregistry.writer"
	gcloud projects add-iam-policy-binding $(PROJECT_ID) \
		--member="serviceAccount:$(CLOUDBUILD_SA)" \
		--role="roles/run.admin"
	gcloud projects add-iam-policy-binding $(PROJECT_ID) \
		--member="serviceAccount:$(CLOUDBUILD_SA)" \
		--role="roles/iam.serviceAccountUser"

setup-docker-auth: ## Configure Docker authentication for Artifact Registry
	@echo "Configuring Docker authentication..."
	gcloud auth configure-docker $(REGION)-docker.pkg.dev

setup-first-time: setup-artifact-registry setup-permissions setup-docker-auth ## Complete first-time setup for new project
	@echo "First-time setup completed!"
	@echo "You can now run 'make deploy' to deploy your application."

deploy: ## Quick deploy using Cloud Build
	gcloud builds submit --config cloudbuild.yaml

deploy-full: ## Full deployment with environment variables
	@echo "Deploying to Google Cloud Run..."
	@echo "Project: $(PROJECT_ID)"
	@echo "Region: $(REGION)"
	./deploy/deploy.sh $(PROJECT_ID) $(REGION)

deploy-env: ## Update environment variables only
	@if [ ! -f "deploy/env-vars.prod.yaml" ]; then \
		echo "Error: deploy/env-vars.prod.yaml not found"; \
		echo "Copy deploy/env-vars.yaml and set your values"; \
		exit 1; \
	fi
	gcloud run services update $(SERVICE_NAME) \
		--env-vars-file deploy/env-vars.prod.yaml \
		--region $(REGION)

logs: ## View service logs
	gcloud run services logs tail $(SERVICE_NAME) --region $(REGION)

status: ## Check service status
	gcloud run services describe $(SERVICE_NAME) --region $(REGION)

url: ## Get service URL
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --format="value(status.url)"

# Development commands
dev: ## Start development server
	npm run dev

install: ## Install dependencies
	npm install

format: ## Format code
	npm run format

lint: ## Lint code
	npm run lint

