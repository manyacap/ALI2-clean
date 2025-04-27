# Stage 1: builder — deps completas y build
FROM node:18-alpine AS builder
WORKDIR /app

# 1) Copiamos package.json + lockfile
COPY package.json package-lock.json ./

# 2) Instalamos todas las deps (prod + dev), ignorando hooks y limitando heap
RUN npm install \
      --ignore-scripts \
      --legacy-peer-deps \
      --max-old-space-size=2048

# 3) Build de Vite
COPY . .
RUN npm run build

# Stage 2: runner — solo producción
FROM node:18-alpine AS runner
WORKDIR /app

# Copiamos artefactos de build y módulos
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# Variables de entorno y puerto
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Servidor estático ligero
RUN npm install -g sirv

# Arranca el server
CMD ["sirv", "dist", "--single", "--port", "3000"]

