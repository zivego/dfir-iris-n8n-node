# Setup and Credentials

## Install in n8n

Open `Settings -> Community nodes -> Install` and enter:

```text
@zivego/n8n-nodes-dfir-iris
```

To install an older release, append a version:

```text
@zivego/n8n-nodes-dfir-iris@4.0.0
```

After installation, create credentials with `DFIR IRIS API (Zivego)`.

## Credential Fields

### API Mode

- `Stable / Legacy (API v2.0.4)`
- `Next / Dev (API v2.1.x)`

Use `Stable / Legacy` unless your IRIS instance is known to expose the newer `api/v2/...` routes.

### Token

Paste a valid IRIS bearer token from the web console.

### Use HTTP

Enable this only when your IRIS deployment is plain HTTP. Leave it disabled for HTTPS deployments.

### Host

Enter the hostname only, not a full URL.

Examples:

- `iris.example.com`
- `10.0.0.15`

Do not enter:

- `https://iris.example.com`
- `iris.example.com/api`

### Ignore SSL Issues

Enable this only when you must connect to a self-signed or otherwise non-standard HTTPS certificate.

### Enable Debug

Enables extra logging from the node. Use it when troubleshooting requests, API mode mismatches, or backend errors.

## Connection Test

The credential test sends a request to:

```text
/api/ping
```

If the credential test fails:

- verify the host is correct and does not include `https://`
- verify the token is valid
- verify HTTP vs HTTPS is correct
- enable `Ignore SSL Issues` only if your certificate is the problem

## Stable vs Next Setup

Use `Stable / Legacy` when:

- you run a released IRIS instance
- you need the broadest operation coverage
- you want the most conservative compatibility

Use `Next / Dev` when:

- your IRIS instance exposes `api/v2/...`
- you want the newer case, asset, IOC, and task routes
- you understand that only the operations advertised as next-compatible are available

See [API modes and compatibility](./api-modes.md) for the exact support model.

## Common Setup Mistakes

### Wrong node or credential selected

Choose:

- `DFIR IRIS (Zivego)`
- `DFIR IRIS API (Zivego)`

Do not select the built-in `DFIR IRIS` integration by accident.

### Full URL in `Host`

The `Host` field expects only the hostname or IP address.

### Invalid token

If the token is invalid, paginated operations and load options should fail with an explicit authentication error, not an empty list.

### Wrong API mode

If `Next / Dev` is selected against an instance that does not expose `api/v2`, next-compatible operations will fail. Switch the credential back to `Stable / Legacy` unless the backend is known to support the newer API surface.
