# DFIR-IRIS API v2.0.4 Coverage

This fork targets the stable DFIR-IRIS REST API `v2.0.4` for the `2.4.x` server line.

Coverage is tracked in [api-v2.0.4-coverage.json](./api-v2.0.4-coverage.json):

- `typed`: endpoint has a dedicated `resource` + `operation` in the node UI
- `raw-only`: endpoint is covered through the `API Request` resource

Release builds run `node scripts/check-api-coverage.mjs` and fail if:

- an endpoint entry is duplicated
- a path format is invalid
- a `typed` entry points to a missing resource or operation
- any endpoint is left with a status outside `typed` or `raw-only`

Deprecated GET deletion routes from older API generations are intentionally excluded from the matrix because DFIR-IRIS marks them unavailable in `v2.0.0+`.
