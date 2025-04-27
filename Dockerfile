# Stage 1: builder
# Etapa builder
FROM node:18-alpine AS builder
WORKDIR /app

# 1) Copiamos sólo package.json (no el lockfile)
COPY package.json ./

# 2) Instalamos dependencias de producción
RUN npm install --omit=dev --legacy-peer-deps --max-old-space-size=2048

# 3) Copiamos el resto del código y compilamos
COPY . .
RUN npm run build


# Stage 2: runner
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

ENV PORT=3000
EXPOSE $PORT

RUN npm install -g sirv
CMD ["sirv", "dist", "--single", "--port", "$PORT"]
