# @zivego/n8n-nodes-dfir-iris

DFIR IRIS node integration for [n8n](https://n8n.io/).

Repository: `zivego/dfir-iris-n8n-node`

This package uses its own runtime identifiers to avoid collisions with the built-in DFIR IRIS integration in modern `n8n`:

- node type: `zivegoDfirIris`
- credential type: `zivegoDfirIrisApi`
- node label in the editor: `DFIR IRIS (Zivego)`
- credential label in the editor: `DFIR IRIS API (Zivego)`

This is a breaking change. Existing workflows and credentials that point at upstream `dfirIris` / `dfirIrisApi` need to be recreated manually.
If you already moved to `4.0.0`, `4.0.2` keeps the same runtime ids and updates only labels, packaging checks, pagination coverage, and edge-case handling.

## Build Requirements

Local build and release tasks require `Node.js 20+`.

If your host uses an older runtime, use the container-safe commands instead:

```sh
npm run build:container
npm run pack:container
```

These commands install `pnpm` ephemerally inside the container and do not require root access.

## Install

The recommended installation path is through the `n8n` UI.

1. Open `Settings` -> `Community nodes`
2. Click `Install`
3. Enter the npm package name:

```text
@zivego/n8n-nodes-dfir-iris
```

4. Confirm the community-node warning
5. Click `Install`

After installation, look for these labels in the editor:

- node: `DFIR IRIS (Zivego)`
- credentials: `DFIR IRIS API (Zivego)`

If your `n8n` instance also ships the built-in DFIR IRIS integration, use the `(Zivego)` suffix to pick this package.

## Install From CLI

If you prefer shell-based installation:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@4.0.2
```

Restart `n8n` after installation.

## Docker Note

If you run `n8n` in Docker with persistent `n8n` data, installing the package from the `n8n` UI is enough and survives normal container restarts and image updates.

Use a custom `Dockerfile` only if you explicitly want the package baked into the image as part of your deployment process.

## Install Before npm Publish

If you want to test a local build before publishing:

```sh
pnpm install
pnpm run pack:tarball
cd ~/.n8n/nodes
npm install /path/to/zivego-n8n-nodes-dfir-iris-4.0.2.tgz
```

Restart `n8n` after installation.

## Replace the upstream package

Do not keep the upstream package and this package installed at the same time.

```sh
cd ~/.n8n/nodes
npm uninstall n8n-nodes-dfir-iris
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-dfir-iris
npm install @zivego/n8n-nodes-dfir-iris@4.0.2
```

Restart `n8n` after the replacement.

## Update

```sh
cd ~/.n8n/nodes
npm update @zivego/n8n-nodes-dfir-iris
```

Or install a specific version:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@4.0.2
```

## Release Checks

```sh
pnpm install
npm run release:check
```

If you previously built inside Docker and `dist` became root-owned, either fix ownership or use the container-safe path:

```sh
npm run build:container
npm run pack:container
```

## Publish

```sh
pnpm install
npm run release:check
npm publish --access public
```

## License

[MIT](LICENSE.md)
