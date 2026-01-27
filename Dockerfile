# =============================================================================
# FitTrack Pro Frontend - Dockerfile
# =============================================================================
# This Dockerfile is for CI/testing purposes ONLY.
# For local development, run Expo directly on your machine:
#   cd fitness-app-frontend
#   EXPO_PUBLIC_API_URL=http://<LAN_IP>:8080/api/v1 npx expo start --host lan
# =============================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

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
