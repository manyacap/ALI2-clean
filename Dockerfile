# Stage 1: builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --max-old-space-size=2048

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