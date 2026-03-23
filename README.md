# @zivego/n8n-nodes-dfir-iris

DFIR IRIS node integration for [n8n](https://n8n.io/).

Repository: `zivego/dfir-iris-n8n-node`

This package uses its own runtime identifiers to avoid collisions with the built-in DFIR IRIS integration in modern `n8n`:

- node type: `zivegoDfirIris`
- credential type: `zivegoDfirIrisApi`
- node label in the editor: `DFIR IRIS (Zivego)`
- credential label in the editor: `DFIR IRIS API (Zivego)`

This is a breaking change. Existing workflows and credentials that point at upstream `dfirIris` / `dfirIrisApi` need to be recreated manually.
If you already moved to `4.0.0`, `4.0.1` keeps the same runtime ids and updates only labels, packaging checks, and edge-case handling.

## Install

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@4.0.1
```

Restart `n8n` after installation.

If your `n8n` instance also ships the built-in DFIR IRIS integration, look for the `(Zivego)` suffix in the node and credential picker.

## Install Before npm Publish

If you want to test a local build before publishing:

```sh
pnpm install
pnpm run pack:tarball
cd ~/.n8n/nodes
npm install /path/to/zivego-n8n-nodes-dfir-iris-4.0.1.tgz
```

Restart `n8n` after installation.

## Replace the upstream package

Do not keep the upstream package and this package installed at the same time.

```sh
cd ~/.n8n/nodes
npm uninstall n8n-nodes-dfir-iris
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-dfir-iris
npm install @zivego/n8n-nodes-dfir-iris@4.0.1
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
npm install @zivego/n8n-nodes-dfir-iris@4.0.1
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
