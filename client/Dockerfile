# -------------------------------------------------------------------
# Stage 1: Build the React + TypeScript + Vite production bundle
# -------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies using package-lock.json for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Optional build arguments (defaults preserve relative /api proxy and default Google Client ID)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_BASE_URL=""

ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy frontend source files and configuration
COPY tsconfig*.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# Compile TypeScript and bundle with Vite for production
RUN npm run build

# -------------------------------------------------------------------
# Stage 2: Serve with lightweight, secure Nginx reverse proxy
# -------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Remove default static pages
RUN rm -rf /usr/share/nginx/html/*

# Copy production build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx reverse proxy & SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check ensuring Nginx responds
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
