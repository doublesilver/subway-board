# ============================================
# Stage 1: Builder
# ============================================
FROM node:22-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ARG VITE_ENABLE_KAKAO_LOGIN=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_KAKAO_LOGIN=$VITE_ENABLE_KAKAO_LOGIN

# Build the application
RUN npm run build

# ============================================
# Stage 2: Runtime (Nginx)
# ============================================
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /build/build /usr/share/nginx/html

# Create non-root user (nginx already runs as nginx user)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 -O /dev/null http://localhost/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
