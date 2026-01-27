# =============================================================================
# FitTrack Pro Frontend - Dockerfile
# =============================================================================
# For CI/testing purposes - runs tests and linting
# Note: React Native Expo apps are not typically deployed as Docker containers
# This is primarily for CI pipelines and testing environments
# =============================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source files
COPY . .

# Default command runs tests
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
