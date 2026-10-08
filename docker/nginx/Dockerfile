# Compilación y empaquetado de frontends en Nginx para producción
FROM node:20-alpine AS builder-form
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY hackaton-form-frontend ./hackaton-form-frontend
RUN if [ -f hackaton-form-frontend/package.json ]; then \
      cd hackaton-form-frontend && pnpm install && pnpm build && mv dist /dist; \
    else \
      mkdir -p /dist && echo "<!DOCTYPE html><html><head><title>Club Enlace</title></head><body><h1>Club Enlace - Formulario de Registro</h1></body></html>" > /dist/index.html; \
    fi

FROM node:20-alpine AS builder-dash
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY hackaton-dash-frontend ./hackaton-dash-frontend
RUN if [ -f hackaton-dash-frontend/package.json ]; then \
      cd hackaton-dash-frontend && pnpm install && pnpm build && mv dist /dist; \
    else \
      mkdir -p /dist && echo "<!DOCTYPE html><html><head><title>Club Enlace Admin</title></head><body><h1>Club Enlace - Panel Intranet</h1></body></html>" > /dist/index.html; \
    fi

# Imagen final ligera de Nginx
FROM nginx:alpine
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder-form /dist /usr/share/nginx/html/form
COPY --from=builder-dash /dist /usr/share/nginx/html/admin

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
