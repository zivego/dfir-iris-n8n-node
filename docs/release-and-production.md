# Release And Production Rollout

This fork is published as `@zivego/n8n-nodes-dfir-iris` so production installs and updates can use normal npm commands.

## Publish a release

1. Update `package.json` and `Changelog.md`.
2. Build and validate the package:

```sh
pnpm install
pnpm run build
pnpm run pack:tarball
```

3. Publish the scoped package:

```sh
pnpm publish --access public --no-git-checks
```

If you need a containerized toolchain instead of a local Node.js installation:

```sh
docker run --rm -it \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:20-bookworm \
  bash -lc "corepack enable && pnpm install && pnpm run build && pnpm publish --access public --no-git-checks"
```

## Production install

For a fresh self-hosted `n8n` installation:

```sh
cd ~/.n8n/nodes
npm install @zivego/n8n-nodes-dfir-iris@2.0.2
```

Restart `n8n`.

## Production migration from upstream

Do not run the upstream package and this fork in the same instance because both export `dfirIris` and `dfirIrisApi`.

```sh
cd ~/.n8n/nodes
npm uninstall n8n-nodes-dfir-iris
rm -rf ~/.n8n/nodes/node_modules/n8n-nodes-dfir-iris
npm install @zivego/n8n-nodes-dfir-iris@2.0.2
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
npm install @zivego/n8n-nodes-dfir-iris@2.0.2
```
