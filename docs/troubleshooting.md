# Troubleshooting

## The Wrong DFIR IRIS Node Appears in n8n

Modern `n8n` versions ship a built-in `DFIR IRIS` integration. This package uses separate runtime identifiers and visible labels to avoid collisions.

Choose:

- node: `DFIR IRIS (Zivego)`
- credentials: `DFIR IRIS API (Zivego)`

## Old Workflows Stop Working After Upgrading from Pre-4.x

Older package versions used different runtime identifiers. If a workflow or credential points to the old ids, it may need to be recreated manually.

Typical symptom:

- `Unrecognized node type` for the old package id

## Invalid Token

If the token is invalid:

- credential test should fail
- paginated operations should return an explicit auth error
- load options should fail instead of showing misleading empty lists

Verify the bearer token in the IRIS web console and recreate the credential if needed.

## Invalid Host

The `Host` field expects only a hostname or IP address.

Correct:

- `iris.example.com`
- `10.0.0.15`

Incorrect:

- `https://iris.example.com`
- `iris.example.com/api`
- `user:pass@iris.example.com`
- `iris.example.com?debug=true`

The node now rejects hosts that include schemes, paths, fragments, credentials, or control characters.

## SSL / Self-Signed Certificates

If your HTTPS certificate is self-signed or otherwise not trusted by the runtime:

- keep `Use HTTP` disabled
- enable `Ignore SSL Issues`

Do not enable this for public or properly managed certificates unless you know why you need it.

## Next / Dev Mode Does Not Show Some Operations

This is expected.

- only operations marked as next-compatible remain visible
- stable-only resources disappear from the picker
- use `API Request` only when you intentionally need an untyped endpoint

See [API modes and compatibility](./api-modes.md).

## API Request Rejects a Path or Header

This is expected if the request tries to escape the configured IRIS host or override connection-level headers.

Rejected path patterns include:

- full URLs such as `https://example.com/api`
- protocol-relative paths such as `//example.com/api`
- paths containing query strings or fragments

Rejected header overrides include:

- `Authorization`
- `Host`
- `Content-Length`
- `Transfer-Encoding`
- `Connection`

Use relative DFIR IRIS paths and let the node handle authentication and connection headers.

## Empty Results vs Real Errors

This package is designed to avoid masking backend failures as empty paginated lists. If a `Get Many` or load-options call fails:

- check the credential first
- verify host and API mode
- confirm the backend route exists in the selected mode

## File Download Naming

For `Datastore File -> Download`, filename resolution works in this order:

1. explicit custom filename
2. filename from the response headers
3. safe generated fallback name

If you receive binary output with a generic fallback filename, the backend probably did not send `content-disposition`.

## `filterCases` / `filterAlerts` Returns Every Record Even With `case_id` / `cid` In `additionalFields`

This is a known IRIS-backend quirk — most Stable / Legacy 2.4.x IRIS builds silently ignore the `case_id` / `cid` fields inside `additionalFields` and return every record from the table. The node sends the fields correctly; the backend drops them.

Symptoms:

- `filterCases` with `additionalFields.case_id = 3` returns the full case list instead of just case 3
- `filterAlerts` with `additionalFields.cid = 1` returns every alert
- workflow looks correct in the node editor, behaviour is wrong at runtime

Workarounds (in order of preference):

1. Use the typed `Case IDs` / `Alert IDs` fields inside the same operation. They send `case_ids` / `alert_ids` (comma-separated), which the backend honours across versions.
2. For per-case retrieval, use `API Request → Send` with `manage/cases/{id}` — returns exactly one record.
3. For per-case alerts, use a two-hop pattern: `manage/cases/{id}` → read `data.alerts[]` → `alerts/filter?alert_ids=...`.
4. If you have a Next / Dev IRIS backend, switch the credential's API Mode to `Next / Dev` — the typed filters behave better there.

## Security Ownership

Some risks cannot be fixed inside this package alone. In particular:

- `n8n` role and credential-sharing policy
- whether untrusted users can edit workflows
- IRIS-side authorization and RBAC
- downstream handling of large or malicious files

Treat those as operator responsibilities, not as guarantees provided by the node itself.
