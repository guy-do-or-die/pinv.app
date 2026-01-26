# ==========================================
# 1. Base Stage
# ==========================================
FROM node:24.13.0-alpine3.23 AS base
WORKDIR /app

# Install build dependencies (python3, make, g++) for isolated-vm
RUN apk add --no-cache python3 make g++ && rm -rf /var/cache/apk/*

# ==========================================
# 2. Dependency Installation
# ==========================================
FROM base AS install

RUN mkdir -p /temp/prod
COPY box/package.json /temp/prod/
RUN cd /temp/prod && npm install --omit=dev

# ==========================================
# 3. Code Staging (Prerelease)
# ==========================================
FROM base AS prerelease
# App Structure:
# /app/box/src
# /app/lib (Shared)
# /app/node_modules (Root)

# Copy Source
COPY box/src box/src
COPY box/package.json box/
COPY box/tsconfig.json box/

# Copy Shared Library (Root Level)
COPY lib lib

# ==========================================
# 4. Final Release Image
# ==========================================
FROM base AS release
ENV PORT=5555
ENV NODE_ENV=production

# Copy Prod Modules to ROOT
COPY --from=install /temp/prod/node_modules node_modules

# Copy Source Code
COPY --from=prerelease /app/box/src box/src
COPY --from=prerelease /app/box/package.json box/
COPY --from=prerelease /app/lib lib


# WORKDIR stays at /app (Root)
WORKDIR /app

# Security: Run as non-root
RUN addgroup -S appuser && adduser -S -G appuser appuser
USER appuser

EXPOSE 5555

# Entrypoint: Run from root
ENTRYPOINT [ "node", "--no-node-snapshot", "--import", "tsx", "box/src/index.ts" ]
