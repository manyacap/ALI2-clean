# Dockerfile
FROM node:18-alpine

# Donde trabajamos
WORKDIR /app

# 1) Copiamos sólo las defs de dependencias e instalamos
COPY package*.json ./
RUN npm install --legacy-peer-deps --verbose

# 2) Copiamos el resto del código
COPY . .

# 3) Ejecutamos el build con salida detallada
RUN npm run build --verbose

# 4) Comando por defecto al arrancar el contenedor
CMD ["npm", "run", "preview"]
