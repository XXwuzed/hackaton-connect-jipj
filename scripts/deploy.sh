#!/usr/bin/env bash
set -Eeuo pipefail

# Se ejecuta en la EC2 mediante SSM; no modifica el checkout dev ni el volumen.
APP_DIR=/opt/hackaton-main
ENV_FILE=/opt/hackaton/.env
test -r "$ENV_FILE" || { echo 'Falta /opt/hackaton/.env' >&2; exit 1; }
test -f "$APP_DIR/docker-compose.prod.yml" || { echo 'Falta docker-compose.prod.yml' >&2; exit 1; }

compose() {
  docker compose --project-name hackaton --env-file "$ENV_FILE" \
    -f "$APP_DIR/docker-compose.prod.yml" "$@"
}

compose config --quiet
compose up -d --build

for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 3 \
      http://127.0.0.1/api/health | grep -qx '{"status":"ok"}'; then
    echo 'API real y PostgreSQL responden correctamente.'
    exit 0
  fi
  sleep 2
done

compose ps
echo 'Despliegue sin health válido; revisar logs antes de reintentar.' >&2
exit 1
