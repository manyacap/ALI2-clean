# Dockerfile multi-stage para Alicia IA

# 1) Builder: instala deps (sin scripts) y compila
FROM node:18-alpine AS builder
WORKDIR /app

# Copiamos lock y manifest
COPY package.json package-lock.json ./

# Instalamos TODO (prod+dev) pero sin scripts para ahorrar memoria
RUN npm ci --legacy-peer-deps --ignore-scripts --no-audit

# Copiamos código y build
COPY . .
RUN npm run build

# 2) Runner: sólo deps de producción y artefactos compilados
FROM node:18-alpine AS runner
WORKDIR /app

# Copiamos sólo manifest para prod
COPY package.json package-lock.json ./

# Instalamos sólo prod (ignora scripts de prepare/husky)
RUN npm ci --omit=dev --ignore-scripts --no-audit

# Copiamos la build final
COPY --from=builder /app/dist ./dist

# Exponemos puerto de Railway (Railway inyecta $PORT)
EXPOSE 4173

# Usamos el start script de package.json (npm run preview con $PORT)
CMD ["npm", "start"]

