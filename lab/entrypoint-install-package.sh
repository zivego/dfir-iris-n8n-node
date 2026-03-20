#!/bin/sh
set -eu

NODE_DIR="/home/node/.n8n/nodes"

if [ -z "${PACKAGE_SPEC:-}" ]; then
	echo "PACKAGE_SPEC is required" >&2
	exit 1
fi

mkdir -p "$NODE_DIR"
chown -R node:node /home/node/.n8n

cd "$NODE_DIR"

su node -s /bin/sh -c "cd \"$NODE_DIR\" && rm -rf node_modules package-lock.json package.json && echo \"Installing community package: $PACKAGE_SPEC\" && npm install --omit=dev \"$PACKAGE_SPEC\""

exec su node -s /bin/sh -c /docker-entrypoint.sh
