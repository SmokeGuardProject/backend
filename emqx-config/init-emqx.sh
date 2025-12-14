#!/bin/sh
set -e

apk add --no-cache curl >/dev/null 2>&1

EMQX_API="http://mqtt:18083/api/v5"
EMQX_USER="${MQTT_DASHBOARD_USER:-admin}"
EMQX_PASS="${MQTT_DASHBOARD_PASSWORD:-public}"
EMQX_AUTH="$EMQX_USER:$EMQX_PASS"

echo "Waiting for EMQX API to be ready..."
until curl -s -f -u "$EMQX_AUTH" "$EMQX_API/status" >/dev/null 2>&1; do
  echo "EMQX not ready, waiting 3 seconds..."
  sleep 3
done
echo "✓ EMQX API is ready!"

echo ""
echo "=========================================="
echo "✓ EMQX initialization completed!"
echo ""
echo "Authentication: HTTP (via Backend API)"
echo "Backend HTTP Auth URL: http://backend:3000/api/mqtt/auth"
echo "Backend HTTP ACL URL: http://backend:3000/api/mqtt/acl"
echo ""
echo "Backend MQTT Client ID: backend-smokeguard"
echo "Backend credentials are managed via environment variables:"
echo "  MQTT_USERNAME=${MQTT_USERNAME:-backend-smokeguard}"
echo "  MQTT_PASSWORD=***hidden***"
echo "=========================================="
