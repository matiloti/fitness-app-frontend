# =============================================================================
# FitTrack Pro Frontend - Dockerfile
# =============================================================================
# Multi-stage Dockerfile for development and CI/testing
# =============================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# -----------------------------------------------------------------------------
# Development Stage - Expo Dev Server for mobile testing
# -----------------------------------------------------------------------------
FROM base AS dev

# Expo SDK 51+ only requires port 8081 for Metro bundler
# (DevTools ports 19000-19002 were removed in SDK 51)
EXPOSE 8081

# Start Expo dev server in LAN mode for physical device testing
# --host lan: Enables LAN mode (replaces deprecated --lan flag)
# --non-interactive: Runs without keyboard shortcuts
CMD ["npx", "expo", "start", "--host", "lan", "--non-interactive"]

# -----------------------------------------------------------------------------
# Default Stage - runs tests
# -----------------------------------------------------------------------------
FROM base AS default

CMD ["npm", "test"]

# -----------------------------------------------------------------------------
# Test Stage - for CI
# -----------------------------------------------------------------------------
FROM base AS test

# Run tests with coverage
CMD ["npm", "run", "test:coverage"]

# -----------------------------------------------------------------------------
# Lint Stage - for CI
# -----------------------------------------------------------------------------
FROM base AS lint

# Run linting and type checking
CMD ["sh", "-c", "npm run lint && npm run typecheck"]
