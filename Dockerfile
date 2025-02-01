# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.12.0
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Build stage
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    pkg-config \
    python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Install node modules
COPY --chown=node:node package*.json ./
RUN npm ci --include=dev

# Copy application code and .env first
COPY --chown=node:node .env .env
COPY --chown=node:node . .

# Set public URLs and load environment variables from .env
ENV PUBLIC_BETTER_AUTH_URL="https://bliptext.com"
ENV PUBLIC_WEBSOCKET_URL="wss://ws.bliptext.com"
ENV $(grep -v '^#' .env | xargs)

# Build application
RUN npm run build && ls -la

# Remove development dependencies
RUN npm prune --omit=dev

# Final production stage
FROM base AS production

# Create app directory and set permissions
RUN mkdir -p /app && chown node:node /app
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json .
COPY --from=build --chown=node:node /app/.env .

# Use node user instead of creating a new one
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000').then(r => process.exit(r.ok ? 0 : 1))"

# Start the application, sourcing the .env file
CMD ["/bin/sh", "-c", "set -a && . ./.env && exec node build/index.js"]
