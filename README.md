![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# @zivego/n8n-nodes-dfir-iris

This is the `zivego` fork of the DFIR IRIS community node for [n8n](https://n8n.io/). It keeps the same runtime node and credential identifiers as upstream (`dfirIris` and `dfirIrisApi`) so existing workflows can keep working after you replace the installed package.

## Why this fork exists

`barn4k/n8n-nodes-dfir-iris@2.0.1` marks the boolean credential field `allowUnauthorizedCerts` as a password field. In current n8n versions this makes `/types/credentials.json` crash with a `.startsWith()` error when the credentials drawer is opened for editing. This fork removes that invalid schema flag, ships the package under a unique npm name, and in `3.0.0` adds a new `API Request` resource plus a release-gated coverage matrix for the stable DFIR-IRIS API.

## Installation

Install the forked package on self-hosted n8n:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

Restart `n8n` after installation.

## Upgrade from upstream

Do not keep the upstream package and this fork installed at the same time because both expose the same `dfirIris` and `dfirIrisApi` identifiers.

```sh
cd ~/.n8n/nodes
npm uninstall n8n-nodes-dfir-iris
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-dfir-iris
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

Restart `n8n` after the replacement.

## Updating and downgrading

Update to the newest published version:

```sh
cd ~/.n8n/nodes
npm update @zivego/n8n-nodes-dfir-iris
```

Install a specific version:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

## Local build and release

This repository uses `pnpm`.

```sh
pnpm install
pnpm run build
pnpm run pack:tarball
```

Validate the release contract locally:

```sh
pnpm run release:check
```

Publish to npm:

```sh
pnpm run release
```

If you do not have Node.js locally, use a disposable container:

```sh
docker run --rm -it \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:20-bookworm \
  bash -lc "corepack enable && pnpm install && pnpm run release:check"
```

## Docker test lab

This repository includes two lab entrypoints:

- `lab/compose.yaml`: dual-n8n regression lab for `n8n 2.12.3` and `n8n 2.4.8`
- `lab/manual-stack.compose.yaml`: full `n8n + Postgres + DFIR-IRIS` acceptance lab

See [docs/lab.md](docs/lab.md) for the full workflow and [docs/release-and-production.md](docs/release-and-production.md) for release and production rollout details.

## Features

Supported IRIS Versions:

- Currently supports API [v2.0.4](https://docs.dfir-iris.org/latest/operations/api/#references) for IRIS v2.4.x

Coverage model:

- Existing typed resources keep their current `resource` and `operation` identifiers for workflow compatibility.
- The credential is pinned to the stable DFIR-IRIS API contract for `2.4.x`, so the UI no longer exposes a decorative API version selector.
- A new typed resource `API Request` can call any stable `v2.0.4` endpoint directly, including endpoints that do not yet have a dedicated typed UI.
- The release build validates [docs/api-v2.0.4-coverage.json](docs/api-v2.0.4-coverage.json) and fails if an endpoint is left as `unsupported`.
- Live acceptance covers package loading in `n8n`, credentials type rendering, credential CRUD/test endpoints, and representative typed resource calls against a real DFIR-IRIS stack.

Typed resource coverage:

| Endpoint | Status |
| -- | -- |
| Alerts | Typed |
| Case Assets | Typed |
| Case General | Typed |
| Case Evidences | Typed |
| Case IOCs | Typed |
| Case Modules | Typed |
| Case Notes | Typed |
| Case Note Directories | Typed |
| Case Tasks | Typed |
| Case Timeline | Typed |
| Comments | Typed |
| Datastore File | Typed |
| Datastore Folder | Typed |
| Manage Metadata Lists | Typed |
| Remaining stable v2.0.4 endpoints | Raw via `API Request` |

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)

## Issues

Report issues in this fork at [zivego/iris-n8n-fork](https://github.com/zivego/iris-n8n-fork).
