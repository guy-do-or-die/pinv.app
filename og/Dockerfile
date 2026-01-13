# Syntax: docker/dockerfile:1
FROM oven/bun:1.2.2 AS builder

WORKDIR /app

# Create minimal package.json for root dependencies (just what lib/ needs)
RUN echo '{"name":"root-deps","private":true,"dependencies":{"viem":"^2.40.3","clsx":"^2.1.1","tailwind-merge":"^3.4.0"}}' > package.json && \
    bun install

# Copy shared code directories
COPY lib ./lib
COPY contracts ./contracts
COPY types ./types
COPY web/public/fonts ./public/fonts
COPY web/public/hero.png ./public/hero.png

# Copy OG service
COPY og ./og

# Install dependencies for OG Service
WORKDIR /app/og
RUN bun install --concurrency 1

# Build
RUN bun run build

# Production Stage
FROM oven/bun:1.2.2 AS runner

WORKDIR /app

# Copy built artifacts and necessary files
COPY --from=builder /app/og/dist ./dist
COPY --from=builder /app/og/package.json ./package.json
COPY --from=builder /app/og/node_modules ./node_modules
COPY --from=builder /app/public/fonts ./dist/public/fonts
COPY --from=builder /app/public/hero.png ./public/hero.png

# Expose port
EXPOSE 8080

CMD ["bun", "dist/og/api/server.js"]
