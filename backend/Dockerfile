FROM node:18 AS builder
WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev --omit=optional

COPY --from=builder /app/dist ./dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
	&& mkdir -p /app/data \
	&& chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
