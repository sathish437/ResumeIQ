# ==============================================================================
# ResumeIQ - Production Multi-Stage Unified Full-Stack Dockerfile
# Builds the React + TypeScript frontend and packages it directly inside the
# Spring Boot executable JAR, producing a single, self-contained container image.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the React + TypeScript Frontend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder

WORKDIR /app/client

# Copy package manifests and install dependencies reproducibly
COPY client/package.json client/package-lock.json ./
RUN npm ci

# Pass frontend build arguments (defaults maintain relative /api calls)
ARG VITE_GOOGLE_CLIENT_ID=837596203973-dnhf7rp7qgpte6bbafunvshu2b0ghmui.apps.googleusercontent.com
ARG VITE_API_BASE_URL=""

ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy frontend source files
COPY client/tsconfig*.json client/vite.config.ts client/index.html ./
COPY client/public ./public
COPY client/src ./src

# Build production frontend bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build the Spring Boot Backend with embedded static frontend
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS backend-builder

WORKDIR /app/server

# Install build utilities
RUN apk add --no-cache bash dos2unix

# Copy Maven wrapper and POM for dependency layer caching
COPY server/.mvn/ .mvn/
COPY server/mvnw server/pom.xml ./

# Normalize line endings in case repository is checked out on Windows
RUN dos2unix mvnw && chmod +x mvnw

# Pre-cache Maven dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy backend source code
COPY server/src ./src

# Copy built frontend assets from Stage 1 into Spring Boot static resources directory
COPY --from=frontend-builder /app/client/dist ./src/main/resources/static/

# Package executable JAR containing backend API + embedded frontend assets
RUN ./mvnw clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 3: Lightweight, Secure JRE Runtime Image
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Install curl for container health check
RUN apk add --no-cache curl

# Create non-root system user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled full-stack JAR from builder stage with non-root ownership
COPY --from=backend-builder --chown=appuser:appgroup /app/server/target/ResumeIQ-0.0.1-SNAPSHOT.jar app.jar

# Switch to unprivileged non-root user
USER appuser

# Expose standard application port
EXPOSE 8080

# Production-tuned container JVM settings
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck inspecting the OpenAPI docs endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/v3/api-docs > /dev/null || exit 1

# Execute Spring Boot application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
