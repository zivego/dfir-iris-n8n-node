# Metadata, Modules, and API Request

## Manage Metadata

Use `Manage Metadata` to populate dropdowns or retrieve lists of IRIS metadata values for stable workflows.

| Operation | Compatibility | What it does |
| --- | --- | --- |
| Get Asset Types | `stable-only` | List available asset types |
| Get Case Classifications | `stable-only` | List case classifications |
| Get Case Customers | `stable-only` | List case customers |
| Get Case States | `stable-only` | List case states |
| Get Case Templates | `stable-only` | List case templates |
| Get Evidence Types | `stable-only` | List evidence types |
| Get IOC Types | `stable-only` | List IOC types |
| Get Severities | `stable-only` | List severity values |
| Get Users | `stable-only` | List users |
| Get Task Statuses | `stable-only` | List task statuses |

## Module

Use `Module` for stable IRIS module integrations.

| Operation | Compatibility | What it does | Typical inputs |
| --- | --- | --- | --- |
| Call Module | `stable-only` | Execute a module call | Module name/ID, object type, targets, module payload |
| List Hooks | `stable-only` | List module hooks | Object type and optional filters |
| List Tasks | `stable-only` | List module tasks | Pagination options |

## API Request

Use `API Request` when you need an endpoint that is not covered by a typed operation or when you want full request control.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Send | `both` | Send an arbitrary API request | Method, path, optional query, headers, body, binary upload/download options | JSON response or binary output |

### Supported API Request Features

- `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- JSON query parameters
- custom JSON headers
- JSON request body
- multipart uploads from binary data
- binary download responses
- optional raw response output

### Typical Paths

Stable examples:

```text
case/export
manage/users/list
```

Next examples:

```text
api/v2/cases
api/v2/cases/1/assets
```

### API Request Notes

- Enter the path without the host
- Authorization comes from the credential automatically
- Use `Download Response` for file-like responses
- Use `Send Binary` for multipart uploads
