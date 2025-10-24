# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nextjs:nodejs backend/ ./

# Create logs directory
RUN mkdir -p logs && chown nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/status', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/advancedServer.js"]
