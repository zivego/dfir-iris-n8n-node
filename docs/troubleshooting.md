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
