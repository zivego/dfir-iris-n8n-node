# Assets, IOCs, and Tasks

## Asset

Use `Asset` to manage assets attached to a case.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `both-with-adapter` | Create a case asset | Case ID, asset name, asset type; optional IP, domain, tags, linked IOCs | Created asset |
| Delete | `both-with-adapter` | Delete an asset | Case ID, asset ID | Delete response |
| Get | `both-with-adapter` | Fetch one asset | Case ID, asset ID | Asset object |
| Get Many | `both-with-adapter` | List assets in a case | Case ID, pagination options | Asset rows |
| Update | `both-with-adapter` | Update asset fields | Case ID, asset ID, changed fields | Updated asset |

### Key Asset Inputs

- `Case ID`
- `Asset Name or ID`
- `Asset Type Name or ID`
- optional `Asset IP`, `Asset Domain`, `Asset Description`, `Asset Tags`, and related IOCs

## IOC

Use `IOC` to manage indicators attached to a case.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `both-with-adapter` | Create an IOC | Case ID, IOC value, IOC type; optional tags, TLP, description | Created IOC |
| Update | `both-with-adapter` | Update IOC fields | Case ID, IOC ID, changed fields | Updated IOC |
| Get | `both-with-adapter` | Fetch one IOC | Case ID, IOC ID | IOC object |
| Get Many | `both-with-adapter` | List IOCs in a case | Case ID, pagination options | IOC rows |
| Delete | `both-with-adapter` | Delete an IOC | Case ID, IOC ID | Delete response |

### Key IOC Inputs

- `Case ID`
- `IOC Name or ID`
- `IOC Value`
- `IOC Type Name or ID`
- optional `IOC TLP`, `IOC Tags`, and description

## Task

Use `Task` to manage case tasks in either mode.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `both-with-adapter` | Create a task | Case ID, task title; optional assignee, status, description, dates | Created task |
| Update | `both-with-adapter` | Update a task | Case ID, task ID, changed fields | Updated task |
| Get | `both-with-adapter` | Fetch one task | Case ID, task ID | Task object |
| Get Many | `both-with-adapter` | List tasks in a case | Case ID, pagination options | Task rows |
| Delete | `both-with-adapter` | Delete a task | Case ID, task ID | Delete response |

### Key Task Inputs

- `Case ID`
- `Task Name or ID`
- task title or task ID depending on the operation
- optional status, assignee, due dates, tags, and free-text fields

## Shared Notes

- These three resources are the main `Next / Dev` typed surface
- In `Next / Dev`, the node uses adapter logic to normalize endpoint routing and responses
- `Get Many` and load options are designed to fail loudly on auth or host errors instead of returning misleading empty lists
