# Multi-stage Dockerfile for production

FROM node:20-alpine AS builder
WORKDIR /app

# Install workspace dependencies
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci --no-audit --no-fund

# Build web and api (copies web/dist into api/dist/public)
COPY . .
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only API runtime deps into apps/api/node_modules
COPY apps/api/package.json apps/api/package.json
RUN npm install --omit=dev --no-audit --no-fund --prefix apps/api \
  && npm cache clean --force

# Copy built API (includes static frontend in dist/public)
COPY --from=builder /app/apps/api/dist apps/api/dist

EXPOSE 3000
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]

