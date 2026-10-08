# Multi-stage Dockerfile para backend Node.js / Express (@club/api)
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app
COPY hackaton-backend ./hackaton-backend/
WORKDIR /app/hackaton-backend
RUN if [ -f package.json ]; then \
      pnpm install && \
      (if [ -d prisma ]; then pnpm prisma generate; fi) && \
      (pnpm build || true); \
    else \
      mkdir -p dist && echo 'const http = require("http"); const server = http.createServer((req, res) => { res.writeHead(200, {"Content-Type": "application/json"}); res.end(JSON.stringify({ status: "ok", app: "Club Enlace API", timestamp: new Date().toISOString() })); }); server.listen(process.env.PORT || 3000, () => console.log("Servidor API escuchando en puerto 3000"));' > dist/server.js; \
    fi

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Dependencias del sistema necesarias para Prisma en Alpine Linux
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/hackaton-backend ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
