# Syntax: docker/dockerfile:1
FROM oven/bun:1.2.2 AS builder

WORKDIR /app

# Copy root config files
COPY package.json bun.lock tsconfig.json ./
# Install root dependencies (for shared lib/hooks)
RUN bun install

# Copy shared code directories
COPY lib ./lib
COPY hooks ./hooks
COPY types ./types
COPY public/fonts ./public/fonts
COPY public/hero.png ./public/hero.png

# Copy OG service
COPY og ./og

# Install dependencies for OG Service
WORKDIR /app/og
RUN bun install

# Build
RUN bun run build

# Production Stage
FROM oven/bun:1.2.2 AS runner

WORKDIR /app

# Copy built artifacts and necessary files
COPY --from=builder /app/og/dist ./dist
COPY --from=builder /app/og/worker.js ./dist/og/worker.js
COPY --from=builder /app/og/package.json ./package.json
COPY --from=builder /app/og/node_modules ./node_modules
COPY --from=builder /app/public/fonts ./public/fonts
COPY --from=builder /app/public/hero.png ./public/hero.png

# Expose port
EXPOSE 8080

CMD ["bun", "dist/og/server.js"]
