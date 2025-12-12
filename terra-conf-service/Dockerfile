FROM eclipse-temurin:17-jre-alpine

# Installer curl pour les health checks
RUN apk add --no-cache curl

WORKDIR /tmp
ADD target/terra-conf-service.jar terra-conf-service.jar

ENTRYPOINT ["java", "-jar", "terra-conf-service.jar"]