# Dockerfile multi-stage para Alicia IA

# 1) deps: instala dependencias (sin usar package-lock.json)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

# 2) builder: compila la aplicación
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# 3) runner: sirve la build en producción
FROM node:18-alpine AS runner
WORKDIR /app
COPY package.json ./
# instalamos solo deps de producción, sin ejecutar hooks
RUN npm install --production --ignore-scripts

# copiamos la carpeta dist compilada desde el builder
COPY --from=builder /app/dist ./dist

# Exponemos el puerto dinámico que suministra Railway vía $PORT
EXPOSE $PORT

# Arrancamos con el script "start" del package.json, que usa $PORT
CMD ["npm", "start"]

