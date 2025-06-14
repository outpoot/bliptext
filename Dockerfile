# syntax = docker/dockerfile:1

# Base Node.js stage
FROM node:20-slim AS base-node
WORKDIR /app
ENV NODE_ENV="production"

# Base Bun stage for websocket
FROM oven/bun:latest AS base-bun
WORKDIR /app

# Build stage for main app
FROM base-node AS build-main
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    pkg-config \
    python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev
COPY .env .env
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Build stage for websocket
FROM base-bun AS build-websocket
WORKDIR /app

# Copy package files and install dependencies
COPY websocket/package.json websocket/bun.lockb ./
RUN bun install --production # Install only production deps

# Copy shared library files
COPY src/lib/shared ./src/lib/shared/

# Copy websocket source files
COPY websocket/src ./websocket/src/

# Production stage for main app
FROM base-node AS production-main
WORKDIR /app
COPY --from=build-main --chown=node:node /app/build ./build
COPY --from=build-main --chown=node:node /app/node_modules ./node_modules
COPY --from=build-main --chown=node:node /app/package.json .
USER node
EXPOSE 3000
CMD ["node", "build/index.js"]

# Production stage for websocket
FROM base-bun AS production-websocket
WORKDIR /app

# Copy dependencies from build stage
COPY --from=build-websocket /app/node_modules ./node_modules

# Copy shared library files
COPY --from=build-websocket /app/src/lib/shared ./src/lib/shared/

# Copy websocket source files into /app/src
COPY --from=build-websocket /app/websocket/src ./src/

EXPOSE 8080

# Debug file structure (optional, can be removed after verification)
RUN ls -la /app/src/lib/shared/
RUN ls -la /app/src/

# Command should now work with the updated import path in main.ts
CMD ["bun", "run", "src/main.ts"]