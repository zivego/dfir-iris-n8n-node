# Docker Labs

This repository ships two Docker-based labs:

- `lab/compose.yaml`: dual-n8n regression lab for `n8n 2.12.3` and `n8n 2.4.8`
- `lab/manual-stack.compose.yaml`: full `n8n + Postgres + DFIR-IRIS` acceptance stack

## 1. Regression lab for the upstream credentials bug

Copy the regression env file:

```sh
cp lab/.env.example lab/.env
```

If you are reusing an older local lab state, either point the lab at fresh data directories in
`lab/.env` or remove the cached n8n data so the saved instance encryption key cannot conflict
with the value in `lab/.env`:

```sh
N8N_LATEST_DATA_DIR=./data/latest-fresh
N8N_BASELINE_DATA_DIR=./data/baseline-fresh
```

To reproduce the upstream bug, leave both package specs on the upstream package:

```dotenv
LATEST_PACKAGE_SPEC=n8n-nodes-dfir-iris@2.0.1
BASELINE_PACKAGE_SPEC=n8n-nodes-dfir-iris@2.0.1
```

Start the regression lab:

```sh
docker compose -f lab/compose.yaml --env-file lab/.env up --build
```

Run the automated regression checks against both `n8n` versions:

```sh
RUN_N8N_REGRESSION_E2E=1 \
N8N_LATEST_BASE_URL=http://127.0.0.1:5678 \
N8N_BASELINE_BASE_URL=http://127.0.0.1:5679 \
N8N_BASIC_AUTH_USER=admin \
N8N_BASIC_AUTH_PASSWORD=n8nlabpass \
pnpm run test:e2e:regression
```

Expected upstream behavior:

- `/types/credentials.json` fails
- the Credentials drawer does not render correctly after clicking `Edit`
- current n8n versions log an exception around `.startsWith()`

To validate the fixed fork instead, update `lab/.env` so both instances install the packed tarball:

```dotenv
LATEST_PACKAGE_SPEC=file:/packages/zivego-n8n-nodes-dfir-iris-3.0.0.tgz
BASELINE_PACKAGE_SPEC=file:/packages/zivego-n8n-nodes-dfir-iris-3.0.0.tgz
```

Expected fixed behavior:

- `/types/credentials.json` returns `200`
- `dfirIrisApi` appears in the credential types payload
- the node remains available as `dfirIris`

## 2. Build the release tarball

If Node.js is available locally:

```sh
pnpm install
pnpm run pack:tarball
```

If not, use Docker:

```sh
docker run --rm -it \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:20-bookworm \
  bash -lc "corepack enable && pnpm install && pnpm run pack:tarball"
```

The tarball is written into `artifacts/`.

## 3. Full acceptance lab with DFIR-IRIS

Copy the full-stack env file:

```sh
cp lab/manual-stack.env.example lab/manual-stack.env
```

If you previously started the acceptance stack with a different `N8N_ENCRYPTION_KEY`, point the
stack at a fresh n8n data directory or clear the persisted one before starting it again:

```sh
N8N_DATA_DIR=./manual-stack.n8n-fresh
```

Generate the self-signed certificates required by the IRIS nginx container:

```sh
./lab/generate-certs.sh
```

Start the stack:

```sh
docker compose --env-file lab/manual-stack.env -f lab/manual-stack.compose.yaml up -d --build
```

This stack gives you:

- `n8n 2.12.3` on `http://localhost:5678`
- `DFIR-IRIS 2.4.x` on `https://localhost:8443`

The acceptance suite expects this stack and validates:

- `n8n` health and package loading
- `/types/credentials.json` and `/types/nodes.json`
- credential create/read/update/test through `n8n` REST endpoints
- representative typed resource calls against a live DFIR-IRIS backend
- `API Request` JSON, raw, binary upload, and binary download paths

When you create credentials through the live `n8n` REST API, use a host value that is reachable
from inside the `n8n` container, for example `host.docker.internal:8443` or `iris-nginx:8443`.
The host-only value `127.0.0.1:8443` works for test code running on the host, but not for
credential tests executed inside the `n8n` container itself.

Run the live suite:

```sh
RUN_LIVE_E2E=1 pnpm run test:e2e:live
```

Or use Docker:

```sh
docker run --rm -it \
  --network host \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:20-bookworm \
  bash -lc "corepack enable && pnpm install && RUN_LIVE_E2E=1 pnpm run test:e2e:live"
```

## 4. Recommended acceptance checks

- valid token + valid host: credentials test should hit `/api/ping`
- invalid token: auth error without breaking the credentials endpoints
- invalid host: network error without breaking the credentials endpoints
- install from tarball into fresh `n8n`: node and credential types both appear
- replacing the upstream package keeps existing `dfirIris` workflows resolvable
