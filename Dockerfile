# Multi-stage Dockerfile for production

FROM node:20-slim AS builder
WORKDIR /app

# Install workspace dependencies
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci --no-audit --no-fund

# Build web and api (copies web/dist into api/dist/public)
COPY . .
RUN npm run build


FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install litestream and required packages
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Download and install litestream
RUN wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz \
  && tar -xzf litestream-v0.3.13-linux-amd64.tar.gz \
  && mv litestream /usr/local/bin/litestream \
  && rm litestream-v0.3.13-linux-amd64.tar.gz

# Install only API runtime deps into apps/api/node_modules
COPY apps/api/package.json apps/api/package.json
RUN npm install --omit=dev --no-audit --no-fund --prefix apps/api \
  && npm cache clean --force

# Copy built API (includes static frontend in dist/public)
COPY --from=builder /app/apps/api/dist apps/api/dist

# Copy necessary files for database migrations
COPY drizzle.config.ts /app/drizzle.config.ts
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY --from=builder /app/apps/api/src/db/schema.ts /app/apps/api/src/db/schema.ts

# Install drizzle-kit for migrations
RUN npm install drizzle-kit --no-audit --no-fund

# Copy litestream configuration and run script
COPY litestream.yml /etc/litestream.yml
COPY run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

# Cloud Run uses PORT environment variable
EXPOSE ${PORT:-3000}

# Use run.sh script as entrypoint
CMD ["/usr/local/bin/run.sh"]
