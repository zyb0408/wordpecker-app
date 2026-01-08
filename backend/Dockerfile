# Stage 1: Build
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including devDependencies like typescript)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (generates dist folder)
RUN pnpm run build

# Stage 2: Production
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
# Copy other necessary files (like migrations or assets if any)
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/lists || exit 1

# Start the application using the compiled JS
CMD ["pnpm", "start"]
