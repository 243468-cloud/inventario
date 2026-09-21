# Etapa 1: Compilación (Build)
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
# Descargar dependencias para hacer caché
RUN mvn dependency:go-offline -B
COPY src ./src
# Compilar limitando memoria del proceso Maven para no exceder 512MB en Render
RUN MAVEN_OPTS="-Xmx384m -XX:MaxMetaspaceSize=128m" mvn clean package -DskipTests

# Etapa 2: Imagen de Producción (Ligera)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Variables de entorno por defecto (se sobreescriben en ejecución)
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=production

# Copiar el jar compilado desde la etapa anterior
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
# SerialGC usa menos memoria que ZGC — ideal para instancias pequeñas
# Heap 220m + Metaspace ~120m + overhead nativo ~100m < 512m total
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-Xmx220m", "-XX:MaxMetaspaceSize=120m", "-jar", "app.jar"]
