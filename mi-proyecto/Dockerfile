# Dockerfile para Frontend (React)
FROM node:24-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Usar nginx para servir la aplicación
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html

# Copiar configuración personalizada de nginx si es necesaria
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]