# Etapa de desarrollo
FROM node:20-alpine

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli@18.0.0

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente
COPY . .

# Exponer puerto de Angular
EXPOSE 4200

# Comando para ejecutar con recarga en caliente
CMD ["node", "--max-old-space-size=512", "./node_modules/@angular/cli/bin/ng", "serve", "--host=0.0.0.0", "--port=4200", "--disable-host-check", "--poll=2000"]

# docker-compose up
# docker build -t finanzas_espacio_nova_front .
# docker run -d -p 9300:9300 finanzas_espacio_nova_front