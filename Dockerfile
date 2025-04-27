# 1) deps: instala solo las deps necesarias para build (incluye devDeps)
FROM node:18-alpine AS deps
WORKDIR /app
# Copiamos lockfile para asegurar reproducibilidad
COPY package.json package-lock.json ./
# Usamos npm install y deshabilitamos audit/log para ahorrar memoria
RUN npm install --legacy-peer-deps --no-audit --loglevel=error

# 2) builder: compila la aplicación
FROM deps AS builder
WORKDIR /app
COPY . .
# Reducimos el heap de Node para que no reviente en memoria
ENV NODE_OPTIONS=--max_old_space_size=512
RUN npm run build

# 3) runner: sirve la build en producción
FROM node:18-alpine AS runner
WORKDIR /app
# Solo deps de producción (sin scripts)
COPY package.json package-lock.json ./
RUN npm ci --production --ignore-scripts --no-audit --loglevel=error
COPY --from=builder /app/dist ./dist

# EXPONE el puerto dinámico de Railway
EXPOSE $PORT
CMD ["npm", "start"]
