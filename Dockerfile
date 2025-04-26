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
# instalamos solo deps de producción
RUN npm install --production --ignore-scripts
# copiamos la carpeta dist compilada
COPY --from=builder /app/dist ./dist

EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]

