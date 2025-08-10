# Ocha

A full-stack TypeScript AI chat application with Google authentication, built for Cloud Run deployment.

## Features

- 🤖 **AI Chat**: OpenAI-powered conversational AI with web search capabilities
- 🔐 **Google Authentication**: Secure OAuth2 authentication with JWT tokens
- 🌐 **Web Search**: Integrated web search tools for enhanced AI responses
- 👥 **Access Control**: Email-based user restrictions for enterprise use
- 📱 **Responsive UI**: Modern React interface with real-time chat
- ☁️ **Cloud Native**: Optimized for Google Cloud Run deployment

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Hono + Node.js with modular architecture
- **Authentication**: Google OAuth2 with JWT token management
- **AI Integration**: Vercel AI SDK with OpenAI
- **Deployment**: Docker + Google Cloud Run

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Open http://localhost:5173
```

### Production Deployment

```bash
# Deploy to Google Cloud Run
./deploy/deploy.sh your-project-id

# Or use make
make deploy-full PROJECT_ID=your-project-id
```

## Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key
- `GOOGLE_CLIENT_ID`: Google OAuth2 client ID

### Optional  
- `AVAILABLE_USERS`: Comma-separated list of allowed email addresses
- `PORT`: Server port (default: 3000)

## Deployment

See [deploy/README.md](deploy/README.md) for detailed deployment instructions.

### Quick Deploy Commands

```bash
# Setup project and enable APIs
make deploy-setup PROJECT_ID=your-project-id

# First-time setup (run only once per project)
make setup-first-time PROJECT_ID=your-project-id

# Deploy application  
make deploy PROJECT_ID=your-project-id

# Update environment variables
make deploy-env
```

## Development Commands

```bash
# Start development
make dev

# Build locally
make build  

# Test Docker build
make docker-build && make docker-run

# Format and lint
make format && make lint
```

## Project Structure

```
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Hono backend
├── deploy/           # Cloud Run deployment files
├── Dockerfile        # Production container
├── cloudbuild.yaml   # Google Cloud Build config
└── Makefile         # Development and deployment commands
```

## License

MIT
