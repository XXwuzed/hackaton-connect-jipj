FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY hackaton-backend/package.json hackaton-backend/package.json
COPY hackaton-form-frontend/package.json hackaton-form-frontend/package.json
COPY hackaton-dash-frontend/package.json hackaton-dash-frontend/package.json
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY hackaton-backend hackaton-backend
RUN pnpm --filter @club/api exec prisma generate \
    && pnpm --filter @club/api build

ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
CMD ["node", "hackaton-backend/dist/server.js"]
