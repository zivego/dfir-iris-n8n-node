![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# @zivego/n8n-nodes-dfir-iris

This is the `zivego` fork of the DFIR IRIS community node for [n8n](https://n8n.io/). It keeps the same runtime node and credential identifiers as upstream (`dfirIris` and `dfirIrisApi`) so existing workflows can keep working after you replace the installed package.

## Why this fork exists

`barn4k/n8n-nodes-dfir-iris@2.0.1` marks the boolean credential field `allowUnauthorizedCerts` as a password field. In current n8n versions this makes `/types/credentials.json` crash with a `.startsWith()` error when the credentials drawer is opened for editing. This fork removes that invalid schema flag and ships the package under a unique npm name so it is easy to install and update in production.

## Installation

Install the forked package on self-hosted n8n:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@2.0.2
```

Restart `n8n` after installation.

## Upgrade from upstream

Do not keep the upstream package and this fork installed at the same time because both expose the same `dfirIris` and `dfirIrisApi` identifiers.

```sh
cd ~/.n8n/nodes
npm uninstall n8n-nodes-dfir-iris
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-dfir-iris
npm install @zivego/n8n-nodes-dfir-iris@2.0.2
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
npm install @zivego/n8n-nodes-dfir-iris@2.0.2
```

## Local build and publish

This repository uses `pnpm`.

```sh
pnpm install
pnpm run build
pnpm run pack:tarball
```

Publish to npm:

```sh
pnpm publish --access public --no-git-checks
```

If you do not have Node.js locally, use a disposable container:

```sh
docker run --rm -it \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:20-bookworm \
  bash -lc "corepack enable && pnpm install && pnpm run build && pnpm run pack:tarball"
```

## Docker test lab

This repository includes a two-instance n8n lab for reproducing the upstream bug and testing the fixed fork against:

- `n8n 2.12.3`
- `n8n 2.4.8`

See [docs/lab.md](docs/lab.md) for the full workflow and [docs/release-and-production.md](docs/release-and-production.md) for release and production rollout details.

## Features

Supported IRIS Versions:

- Currently supports API [v2.0.4](https://docs.dfir-iris.org/latest/operations/api/#references) for IRIS v2.4.x

Supported operations:

| Endpoint | Status |
| -- | -- |
| Alerts | Fully supported |
| Case Assets | Fully supported |
| Case General | Fully supported since v2 |
| Case Evidence | Fully supported since v2 |
| Case IOCs | Fully supported |
| Case Modules | Fully supported since v2 |
| Case Notes | Fully supported |
| Case Note Groups | Fully supported |
| Case Tasks | Fully supported |
| Case Timeline | Fully supported since v2 |
| Comments | Fully supported |
| Datastore File | Fully supported |
| Datastore Folder | Fully supported |

No additional endpoints are planned at the moment.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)

## Issues

Report issues in this fork at [zivego/iris-n8n-fork](https://github.com/zivego/iris-n8n-fork).
