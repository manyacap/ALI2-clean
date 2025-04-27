# Stage 1: builder — instala deps de prod y compila con Vite
FROM node:18-alpine AS builder
WORKDIR /app

# Copiamos sólo lo esencial para instalar deps
COPY package.json package-lock.json ./

# Instalamos sólo prod deps, ignorando scripts (prepare/husky), y limitando heap
RUN npm install \
      --omit=dev \
      --ignore-scripts \
      --legacy-peer-deps \
      --max-old-space-size=2048

# Copiamos todo el código y lanzamos el build de Vite
COPY . .
RUN npm run build

# Stage 2: runner — servidor minimalista
FROM node:18-alpine AS runner
WORKDIR /app

# Copiamos artefactos de build y módulos de prod desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# Variables de entorno y puerto
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Instalamos un servidor estático ligero
RUN npm install -g sirv

# Arranca sirv sirviendo /dist en el puerto indicado
CMD ["sirv", "dist", "--single", "--port", "3000"]
