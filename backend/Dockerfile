# Use an official Gradle image to build the app
FROM gradle:8.5-jdk17 AS build

# Set the working directory
WORKDIR /app

# Copy only build-related files first to leverage Docker cache
COPY build.gradle /app/

# Download dependencies
RUN gradle build --no-daemon || return 0

# Copy the rest of the application source
COPY ./src/main /app/src/main

# Build the application
RUN gradle build --no-daemon

# Use a lightweight JDK base image for the runtime
FROM eclipse-temurin:17-jdk-alpine
# FROM openjdk:17-slim

# Set working directory
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]


# # Build stage
# FROM gradle:jdk17 AS BUILD
# WORKDIR /usr/app/
# COPY ./src/main ./src/main
# COPY ./build.gradle ./build.gradle
# COPY ./gradlew ./gradlew
# COPY ./gradlew.bat ./gradlew.bat
# RUN gradle build
#
# # Package stage
# FROM openjdk:17-slim
# ENV JAR_NAME=app.jar
# ENV APP_HOME=/usr/app/
# WORKDIR $APP_HOME
# COPY --from=BUILD $APP_HOME/build/libs/$JAR_NAME .
# EXPOSE 8080
# ENTRYPOINT ["java", "-jar", "$APP_HOME/$JAR_NAME"]