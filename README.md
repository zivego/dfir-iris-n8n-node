# @zivego/n8n-nodes-dfir-iris

DFIR IRIS node integration for [n8n](https://n8n.io/).

Repository: `zivego/dfir-iris-n8n-node`

This package keeps the same runtime identifiers as upstream:

- node type: `dfirIris`
- credential type: `dfirIrisApi`

That means existing workflows can keep working after you replace the original package with this one.

## Install

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

Restart `n8n` after installation.

## Install Before npm Publish

If you want to test a local build before publishing:

```sh
pnpm install
pnpm run pack:tarball
cd ~/.n8n/nodes
npm install /path/to/zivego-n8n-nodes-dfir-iris-3.0.0.tgz
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

Or install a specific version:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@3.0.1
```

## Publish

```sh
pnpm install
pnpm run build
npm publish --access public
```

## License

[MIT](LICENSE.md)
