# Release And Production Rollout

This fork is published as `@zivego/n8n-nodes-dfir-iris` so production installs and updates can use normal npm commands.

## Publish a release

1. Update `package.json`, `Changelog.md`, `docs/api-v2.0.4-coverage.json`, and `docs/api-v2.1.x-coverage.json`.
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

## API mode rollout

- `Stable / Legacy` is the production default and is backward-compatible with existing workflows.
- `Next / Dev` is opt-in through the `dfirIrisApi` credential.
- Do not switch existing production credentials to `Next / Dev` unless the target DFIR-IRIS runtime is known to expose the `api/v2/...` routes used by this branch.

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
