# Etapa 1: Compilación (Build)
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
# Descargar dependencias para hacer caché
RUN mvn dependency:go-offline -B
COPY src ./src
# Compilar el proyecto empaquetando todo en un .jar
RUN mvn clean package -DskipTests

# Etapa 2: Imagen de Producción (Ligera)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Variables de entorno por defecto (se sobreescriben en ejecución)
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=production

# Copiar el jar compilado desde la etapa anterior
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
# Iniciar la aplicación de manera optimizada
ENTRYPOINT ["java", "-XX:+UseZGC", "-Xmx512m", "-jar", "app.jar"]
