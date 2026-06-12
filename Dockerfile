# =========================================================
# Stage 1: Build stage
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build Vite frontend assets and bundle Express backend into dist/server.cjs
RUN npm run build

# =========================================================
# Stage 2: Runtime stage
# =========================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Run as non-production (safer runtime constraint)
ENV NODE_ENV=production
ENV PORT=3000

# Copy build artifacts and dependencies descriptor
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose server ingress port
EXPOSE 3000

# Use a non-root user for security hardening
USER node

# Execute the self-contained production bundle
CMD ["node", "dist/server.cjs"]
