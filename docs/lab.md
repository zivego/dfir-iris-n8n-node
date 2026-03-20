# Docker Lab

This repository ships a two-instance Docker lab for reproducing the upstream credentials bug and validating the fork.

## Instances

- `n8n-latest`: `n8n 2.12.3` on `http://localhost:5678`
- `n8n-baseline`: `n8n 2.4.8` on `http://localhost:5679`

Both services install exactly one community package at startup from `PACKAGE_SPEC`.

## 1. Reproduce the upstream bug

Copy the lab env file:

```sh
cp lab/.env.example lab/.env
```

Leave both package specs on the upstream package:

```dotenv
LATEST_PACKAGE_SPEC=n8n-nodes-dfir-iris@2.0.1
BASELINE_PACKAGE_SPEC=n8n-nodes-dfir-iris@2.0.1
```

Start the lab:

```sh
docker compose -f lab/compose.yaml --env-file lab/.env up --build
```

Reproduction path in the UI:

1. Create or open a workflow with the `DFIR IRIS` node.
2. Select or create `DFIR IRIS API` credentials.
3. Click `Edit`.
4. Watch the network request to `/types/credentials.json`.

Expected upstream behavior:

- the request fails
- n8n logs an exception around `.startsWith()`
- the Credentials drawer does not render correctly

## 2. Build the forked tarball

If Node.js is available locally:

```sh
pnpm install
pnpm run build
pnpm run pack:tarball
```

If not, use Docker:

```sh
docker run --rm -it \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:20-bookworm \
  bash -lc "corepack enable && pnpm install && pnpm run build && pnpm run pack:tarball"
```

The tarball will be written into `artifacts/`.

## 3. Test the fixed fork in the same lab

Update `lab/.env` so both services install the tarball instead of the upstream package:

```dotenv
LATEST_PACKAGE_SPEC=file:/packages/zivego-n8n-nodes-dfir-iris-2.0.2.tgz
BASELINE_PACKAGE_SPEC=file:/packages/zivego-n8n-nodes-dfir-iris-2.0.2.tgz
```

Restart the lab:

```sh
docker compose -f lab/compose.yaml --env-file lab/.env up --build
```

Expected fixed behavior:

- `/types/credentials.json` returns `200`
- the Credentials drawer opens
- editing an existing credential works
- saving credentials works
- `Test` succeeds against a reachable IRIS instance

## 4. Recommended smoke tests

- valid token + valid host: credentials test should hit `/api/ping`
- invalid token: auth error without breaking the UI
- invalid host: network error without breaking the UI
- existing workflow using `dfirIris` still resolves the node after replacing the package
