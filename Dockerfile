# 1) deps: instala únicamente package.json
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2) builder: compila la aplicación
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# 3) runner: sirve la build en producción
FROM node:18-alpine AS runner
WORKDIR /app

# Instalamos solo deps de producción + install global de 'serve'
COPY package.json package-lock.json ./
RUN npm ci --production --omit=dev && \
    npm install --global serve

# Copiamos la carpeta generada por el builder
COPY --from=builder /app/dist ./dist

# Exponer el puerto que Railway inyecta en la variable $PORT
EXPOSE $PORT

# Arrancar con 'npm start' (usa 'serve' para servir dist)
CMD ["npm", "start"]

