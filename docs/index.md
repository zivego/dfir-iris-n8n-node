# DFIR IRIS (Zivego) Documentation

`@zivego/n8n-nodes-dfir-iris` adds a DFIR IRIS community node to `n8n` with support for both the stable legacy API and the newer `api/v2` development surface.

## What This Node Covers

- 15 resources
- 86 operations
- `Stable / Legacy` mode for the classic IRIS API
- `Next / Dev` mode for the newer `api/v2` endpoints
- `API Request` for advanced and escape-hatch calls

Compatibility summary:

- `63` operations are `stable-only`
- `22` operations are `both-with-adapter`
- `1` operation is `both`

## Start Here

- [Setup and credentials](./setup.md)
- [API modes and compatibility](./api-modes.md)
- [Resource overview](./resources.md)
- [Examples](./examples.md)
- [Troubleshooting](./troubleshooting.md)

## Reference Pages

- [Cases and alerts](./reference/cases-and-alerts.md)
- [Assets, IOCs, and tasks](./reference/assets-iocs-tasks.md)
- [Comments, notes, evidence, and timeline](./reference/comments-notes-evidence-timeline.md)
- [Datastore](./reference/datastore.md)
- [Metadata, modules, and API Request](./reference/metadata-modules-api-request.md)

## Official DFIR IRIS API References

Use the official IRIS documentation when you need backend-specific field semantics or endpoint-level details:

- [Stable / Legacy API reference](https://docs.dfir-iris.org/latest/_static/iris_api_reference_v2.0.4.html)
- [Latest IRIS API operations](https://docs.dfir-iris.org/latest/operations/api/)

## Important Naming

In the `n8n` editor, select:

- node: `DFIR IRIS (Zivego)`
- credentials: `DFIR IRIS API (Zivego)`

This avoids confusion with the built-in `DFIR IRIS` integration shipped in modern `n8n` versions.
