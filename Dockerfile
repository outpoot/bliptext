# syntax = docker/dockerfile:1

# Base Node.js stage
ARG NODE_VERSION=22.12.0
FROM node:${NODE_VERSION}-slim AS base-node

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

COPY --chown=node:node package*.json ./
RUN npm ci --include=dev
COPY --chown=node:node . .
RUN npm run build
RUN npm prune --omit=dev

# Build stage for websocket
FROM base-bun AS build-websocket
COPY websocket/package*.json websocket/bun.lockb ./
RUN bun install
COPY src/lib/shared src/lib/shared/
COPY websocket/src src/

# Production stage for main app
FROM base-node AS production-main
WORKDIR /app
COPY --from=build-main --chown=node:node /app/build ./build
COPY --from=build-main --chown=node:node /app/node_modules ./node_modules
COPY --from=build-main --chown=node:node /app/package.json .
COPY --from=build-main --chown=node:node /app/.env .env
USER node
EXPOSE 3000
CMD ["node", "build/index.js"]

# Production stage for websocket
FROM base-bun AS production-websocket
WORKDIR /app
COPY --from=build-websocket /app/ .
EXPOSE 8080
CMD ["bun", "run", "src/main.ts"]