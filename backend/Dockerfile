# Multi-stage build for Spring Boot application
# Stage 1: Build the application with Gradle
FROM gradle:8-jdk17 AS builder

WORKDIR /app

# Copy Gradle configuration files
COPY build.gradle.kts settings.gradle.kts ./

# Copy source code
COPY src ./src

# Build the application (skip tests for Docker build speed)
RUN gradle build --no-daemon -x test

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Create directories for H2 data and file uploads and install curl for healthchecks
RUN mkdir -p /app/data /app/uploads && \
    apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Expose application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
