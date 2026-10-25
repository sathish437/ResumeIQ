# -------------------------------------------------------------------
# Stage 1: Build the Spring Boot executable JAR with Maven wrapper
# -------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Ensure curl and dos2unix are available
RUN apk add --no-cache bash dos2unix

# Copy Maven wrapper and POM first for layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Normalize line endings in case repository is checked out on Windows
RUN dos2unix mvnw && chmod +x mvnw

# Pre-cache Maven dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build production jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# -------------------------------------------------------------------
# Stage 2: Lightweight, secure JRE runtime container
# -------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Install curl for reliable container health check
RUN apk add --no-cache curl

# Create non-root system user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR from builder stage with proper non-root ownership
COPY --from=builder --chown=appuser:appgroup /app/target/ResumeIQ-0.0.1-SNAPSHOT.jar app.jar

# Switch to non-root user
USER appuser

# Expose default Spring Boot web port
EXPOSE 8080

# Production-tuned JVM flags (budgeted for 512MB container limits, G1 garbage collector)
ENV JAVA_OPTS="-XX:+UseG1GC -Xmx320m -Xms128m -XX:MaxMetaspaceSize=128m -Djava.security.egd=file:/dev/./urandom"

# Healthcheck inspecting the OpenAPI v3 docs endpoint using Render dynamic PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/v3/api-docs > /dev/null || exit 1

# Execute Spring Boot application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
