# Resource Overview

This page maps the full public surface of the node and links to the detailed reference pages.

## Resource Families

| Resource | Operations | Compatibility | Reference |
| --- | ---: | --- | --- |
| Alert | 12 | `stable-only` | [Cases and alerts](./reference/cases-and-alerts.md) |
| API Request | 1 | `both` | [Metadata, modules, and API Request](./reference/metadata-modules-api-request.md) |
| Asset | 5 | `both-with-adapter` | [Assets, IOCs, and tasks](./reference/assets-iocs-tasks.md) |
| Case | 9 | mixed | [Cases and alerts](./reference/cases-and-alerts.md) |
| Comment | 4 | `stable-only` | [Comments, notes, evidence, and timeline](./reference/comments-notes-evidence-timeline.md) |
| Datastore File | 6 | `stable-only` | [Datastore](./reference/datastore.md) |
| Datastore Folder | 5 | `stable-only` | [Datastore](./reference/datastore.md) |
| Evidence | 5 | `stable-only` | [Comments, notes, evidence, and timeline](./reference/comments-notes-evidence-timeline.md) |
| IOC | 5 | `both-with-adapter` | [Assets, IOCs, and tasks](./reference/assets-iocs-tasks.md) |
| Manage Metadata | 10 | `stable-only` | [Metadata, modules, and API Request](./reference/metadata-modules-api-request.md) |
| Module | 3 | `stable-only` | [Metadata, modules, and API Request](./reference/metadata-modules-api-request.md) |
| Note | 5 | `stable-only` | [Comments, notes, evidence, and timeline](./reference/comments-notes-evidence-timeline.md) |
| Note Group | 4 | `stable-only` | [Comments, notes, evidence, and timeline](./reference/comments-notes-evidence-timeline.md) |
| Task | 5 | `both-with-adapter` | [Assets, IOCs, and tasks](./reference/assets-iocs-tasks.md) |
| Timeline | 7 | `stable-only` | [Comments, notes, evidence, and timeline](./reference/comments-notes-evidence-timeline.md) |

## Coverage Notes

- `Case`, `Asset`, `IOC`, and `Task` contain the main dual-mode surface
- `API Request` is available in both modes
- All other resources are currently stable-only

## Recommended Reading Order

1. [Setup and credentials](./setup.md)
2. [API modes and compatibility](./api-modes.md)
3. The reference page for the resource family you need
4. [Examples](./examples.md)
5. [Troubleshooting](./troubleshooting.md) if something still fails
