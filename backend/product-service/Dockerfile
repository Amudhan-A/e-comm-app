FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Fix Windows CRLF issues with the maven wrapper and make executable
RUN apt-get update && apt-get install -y dos2unix && dos2unix mvnw && chmod +x mvnw

COPY src src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render requires apps to bind dynamically to the PORT environment variable
CMD java -jar app.jar --server.port=${PORT:-8080}
