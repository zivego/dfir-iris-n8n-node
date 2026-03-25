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

Install from the `n8n` UI:

```text
@zivego/n8n-nodes-dfir-iris
```

Then select:

- node: `DFIR IRIS (Zivego)`
- credentials: `DFIR IRIS API (Zivego)`

CLI alternative:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@4.0.2
```

Restart `n8n` after installation.

## Docker Note

With persistent `n8n` data, UI installation survives normal Docker restarts and image updates.

## Local Tarball

To test a local build before publishing:

```sh
pnpm install
pnpm run pack:tarball
cd ~/.n8n/nodes
npm install /path/to/zivego-n8n-nodes-dfir-iris-4.0.2.tgz
```

Restart `n8n` after installation.

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

## Build And Publish

```sh
pnpm install
npm run release:check
npm publish --access public
```

## License

[MIT](LICENSE.md)
