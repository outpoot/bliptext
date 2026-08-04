# syntax = docker/dockerfile:1

# Base Node.js stage
FROM node:20-slim AS base-node
WORKDIR /app
ENV NODE_ENV="production"

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
FROM base-node AS build-websocket
WORKDIR /app/websocket

# Copy package files and install dependencies
COPY websocket/package*.json ./
RUN npm ci --include=dev

# Copy shared library files
COPY src/lib/shared /app/src/lib/shared/

# Copy websocket source files
COPY websocket/src ./src/
RUN npm run build
RUN npm prune --omit=dev

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
FROM base-node AS production-websocket
WORKDIR /app

# Copy dependencies from build stage
COPY --from=build-websocket /app/websocket/node_modules ./node_modules
COPY --from=build-websocket /app/websocket/dist ./dist

EXPOSE 8080

CMD ["node", "dist/main.cjs"]
