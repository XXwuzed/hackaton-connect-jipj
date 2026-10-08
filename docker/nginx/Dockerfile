FROM node:20-bookworm-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY hackaton-backend/package.json hackaton-backend/package.json
COPY hackaton-form-frontend/package.json hackaton-form-frontend/package.json
COPY hackaton-dash-frontend/package.json hackaton-dash-frontend/package.json
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY hackaton-form-frontend hackaton-form-frontend
COPY hackaton-dash-frontend hackaton-dash-frontend
ARG VITE_RECAPTCHA_SITE_KEY
ENV VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}
RUN test -n "$VITE_RECAPTCHA_SITE_KEY" \
    && pnpm --filter @club/customer-web build \
    && pnpm --filter @club/admin-web build

FROM nginx:stable-alpine
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/hackaton-form-frontend/dist /usr/share/nginx/html/form
COPY --from=builder /app/hackaton-dash-frontend/dist /usr/share/nginx/html/admin
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
