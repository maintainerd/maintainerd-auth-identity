# Production Dockerfile for React + Vite app
# Multi-stage build for optimized production image

# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
}' > /etc/nginx/conf.d/default.conf \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run \
    && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]
