FROM maven:3-eclipse-temurin-21-alpine AS builder

WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S roadguard && \
    adduser -S -G roadguard -h /app roadguard

WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

RUN chown -R roadguard:roadguard /app

USER roadguard

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
