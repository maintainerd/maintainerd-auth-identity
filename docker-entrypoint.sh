#!/bin/sh
set -eu

# Runtime configuration injection.
#
# The image is built once and can be deployed against different API origins.
# Instead of baking the API base URL into the JS bundle, we write a small
# config.js at container start from environment variables. index.html loads it
# before the app bundle, and config.ts reads window.__ENV__ (falling back to the
# build-time import.meta.env value when unset).
CONFIG_PATH="${CONFIG_PATH:-/usr/share/nginx/html/config.js}"

cat > "$CONFIG_PATH" <<EOF
window.__ENV__ = {
  VITE_AUTH_API_BASE_URL: "${VITE_AUTH_API_BASE_URL:-}"
};
EOF

exec "$@"
