# Development image: runs the app with the Jetty Maven plugin.
FROM maven:3.9-eclipse-temurin-21

WORKDIR /app

# Resolve dependencies first so they are cached between source changes
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src

EXPOSE 8080
CMD ["mvn", "-B", "-q", "-DskipTests", "-Djetty.http.port=8080", "jetty:run"]
