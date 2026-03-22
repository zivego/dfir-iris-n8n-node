# Docker Labs

This repository ships three Docker-based labs:

- `lab/compose.yaml`: dual-n8n regression lab for `n8n 2.12.3` and `n8n 2.4.8`
- `lab/manual-stack.compose.yaml`: full `n8n + Postgres + DFIR-IRIS` acceptance stack
- `lab/manual-stack.next.compose.yaml`: companion `n8n + Postgres` stack for a source-built DFIR-IRIS `develop` runtime

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
- credential create/read/update/test through `n8n` REST endpoints in `Stable / Legacy` mode
- representative typed resource calls against a live DFIR-IRIS backend
- `API Request` JSON, raw, binary upload, and binary download paths

If you want to exercise the opt-in `Next / Dev` mode, create a second credential in `n8n` and switch `API Mode` from `Stable / Legacy` to `Next / Dev`. Only the resources marked as dual-mode in the compatibility manifest will remain visible.

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

## 4. Next / Dev acceptance lab

The opt-in `Next / Dev` mode is validated against a source-built `dfir-iris/iris-web` `develop`
runtime because the released `2.4.x` images do not consistently expose the documented
`/api/v2/...` surface.

Validated upstream ref:

- `dfir-iris/iris-web@e6e6d797ee29be261b699b8c64c425e89959c1dd`

Expected live routes on that runtime:

- `GET /api/v2/cases`
- `GET /api/v2/cases/{id}`
- `GET /api/v2/cases/{id}/assets`
- `GET /api/v2/cases/{id}/iocs`
- `GET /api/v2/cases/{id}/tasks`

Bring up the source-built DFIR runtime separately, then copy the next env file:

```sh
cp lab/manual-stack.next.env.example lab/manual-stack.next.env
```

Start the companion `n8n` stack:

```sh
docker compose --env-file lab/manual-stack.next.env -f lab/manual-stack.next.compose.yaml up -d --build
```

This stack gives you:

- `n8n 2.12.3` on `http://localhost:5676`
- `DFIR-IRIS develop` on `http://localhost:18000`

Run the live next acceptance suite:

```sh
RUN_LIVE_E2E_NEXT=1 \
DFIR_IRIS_NEXT_HOST=127.0.0.1:18000 \
DFIR_IRIS_NEXT_IS_HTTP=1 \
DFIR_IRIS_NEXT_TOKEN=<token> \
N8N_NEXT_BASE_URL=http://127.0.0.1:5676 \
N8N_NEXT_BASIC_AUTH_USER=admin \
N8N_NEXT_BASIC_AUTH_PASSWORD=n8nlabpass \
N8N_DFIR_IRIS_NEXT_HOST=host.docker.internal:18000 \
pnpm run test:e2e:live:next
```

The next acceptance suite validates:

- next-mode credential create/read/update/test through `n8n` REST
- stable-only operation rejection when `apiMode=next`
- typed `case`, `asset`, `ioc`, and `task` CRUD against live `/api/v2/...` routes
- version-aware `API Request` CRUD and error handling
- invalid token and invalid host negative paths

## 5. Recommended acceptance checks

- valid token + valid host: credentials test should hit `/api/ping`
- invalid token: auth error without breaking the credentials endpoints
- invalid host: network error without breaking the credentials endpoints
- install from tarball into fresh `n8n`: node and credential types both appear
- replacing the upstream package keeps existing `dfirIris` workflows resolvable
