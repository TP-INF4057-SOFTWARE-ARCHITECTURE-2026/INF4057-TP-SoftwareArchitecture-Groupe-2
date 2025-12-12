FROM eclipse-temurin:17-jre-alpine

# Installer curl pour les health checks
RUN apk add --no-cache curl

WORKDIR /tmp
ADD target/terra-registry-service.jar terra-registry-service.jar

ENTRYPOINT ["java", "-jar", "terra-registry-service.jar"]