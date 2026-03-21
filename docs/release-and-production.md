# Release And Production Rollout

This fork is published as `@zivego/n8n-nodes-dfir-iris` so production installs and updates can use normal npm commands.

## Publish a release

1. Update `package.json`, `Changelog.md`, and `docs/api-v2.0.4-coverage.json`.
2. Run the full release contract:

```sh
pnpm install
pnpm run release:check
```

3. Publish the scoped package:

```sh
pnpm run release
```

If you need a containerized toolchain instead of a local Node.js installation:

```sh
docker run --rm -it \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:20-bookworm \
  bash -lc "corepack enable && pnpm install && pnpm run release:check && pnpm run release"
```

## Production install

For a fresh self-hosted `n8n` installation:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

Restart `n8n`.

## Production migration from upstream

Do not run the upstream package and this fork in the same instance because both export `dfirIris` and `dfirIrisApi`.

```sh
cd ~/.n8n/nodes
npm uninstall n8n-nodes-dfir-iris
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-dfir-iris
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```

Restart `n8n` after the replacement.

## Upgrades and downgrades

Upgrade to the latest published version:

```sh
cd ~/.n8n/nodes
npm update @zivego/n8n-nodes-dfir-iris
```

Pin to a specific version:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@3.0.0
```
