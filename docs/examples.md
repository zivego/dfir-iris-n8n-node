# Examples

These examples are intentionally user-facing and avoid local lab-specific data.

## Example 1: Stable Credential

Create `DFIR IRIS API (Zivego)` credentials with:

- `API Mode`: `Stable / Legacy (API v2.0.4)`
- `Token`: your IRIS bearer token
- `Use HTTP`: `false` unless your server is plain HTTP
- `Host`: `iris.example.com`
- `Ignore SSL Issues`: `true` only for self-signed HTTPS

## Example 2: Next Credential

Create `DFIR IRIS API (Zivego)` credentials with:

- `API Mode`: `Next / Dev (API v2.1.x)`
- `Token`: your IRIS bearer token
- `Host`: the same hostname used by your IRIS environment

Only choose this mode if the backend is known to expose `api/v2/...`.

## Example 3: Create a Case

Use:

- Resource: `Case`
- Operation: `Add`

Typical fields:

- `Case Name`
- `Case Description`
- `Case Customer Name or ID`
- optional owner, reviewer, classification, and SOC ID

Use this flow in either `Stable / Legacy` or `Next / Dev`.

## Example 4: List Case Assets

Use:

- Resource: `Asset`
- Operation: `Get Many`

Typical fields:

- `Case ID`
- optional pagination or return-all options

This works in both modes through the compatibility layer.

## Example 5: Add an IOC

Use:

- Resource: `IOC`
- Operation: `Add`

Typical fields:

- `Case ID`
- `IOC Value`
- `IOC Type Name or ID`
- optional tags, TLP, and description

## Example 6: Add a Task

Use:

- Resource: `Task`
- Operation: `Add`

Typical fields:

- `Case ID`
- task title
- optional assignee, status, due date, and description

## Example 7: Stable API Request

Use:

- Resource: `API Request`
- Operation: `Send`
- Method: `GET`
- Path: `manage/users/list`

Optional:

- `Options -> Return Raw` when you want the full envelope

## Example 8: Next API Request

Use:

- Resource: `API Request`
- Operation: `Send`
- Method: `GET`
- Path: `api/v2/cases`

This is useful when you want to reach a next-compatible route that is not exposed as a typed operation yet.

## Example 9: Download a Datastore File

Use:

- Resource: `Datastore File`
- Operation: `Download`

Typical fields:

- `Case ID`
- file identifier
- binary output field, for example `data`

If no filename is returned by the backend, the node falls back to a safe generated name.

## Example 10: Upload a File

Use:

- Resource: `Datastore File`
- Operation: `Upload`

Requirements:

- a previous node must provide binary data
- set the correct binary property name
- choose the target case and folder
