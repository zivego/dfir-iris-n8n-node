# @zivego/n8n-nodes-dfir-iris

Community node for [n8n](https://n8n.io/) that integrates with DFIR IRIS.

This fork keeps the same runtime identifiers as upstream:

- node type: `dfirIris`
- credential type: `dfirIrisApi`

That means existing workflows can keep working after you replace the original package with this fork.

## Install

On a self-hosted `n8n` instance:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

Restart `n8n` after installation.

## Replace the upstream package

Do not keep the upstream package and this fork installed at the same time.

```sh
cd ~/.n8n/nodes
npm uninstall n8n-nodes-dfir-iris
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-dfir-iris
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

Restart `n8n` after the replacement.

## Update

```sh
cd ~/.n8n/nodes
npm update @zivego/n8n-nodes-dfir-iris
```

## Build locally

```sh
pnpm install
pnpm run build
pnpm run pack:tarball
```

## License

[MIT](LICENSE.md)
