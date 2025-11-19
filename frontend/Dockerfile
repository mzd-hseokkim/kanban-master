# Multi-stage build for React application
# Stage 1: Build the React app with npm
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace manifests so npm can install with the shared lockfile
COPY package*.json ./
COPY frontend/package.json ./frontend/

# Install only the frontend workspace dependencies defined in the root lockfile
RUN npm ci --workspace frontend --include-workspace-root=false

# Copy frontend source code
COPY frontend ./frontend

# Build the frontend workspace
RUN npm run build --workspace frontend

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose frontend port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
