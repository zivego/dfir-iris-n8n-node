# Cases and Alerts

## Case

Use `Case` when you need to create, search, summarize, update, export, or delete investigation cases.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `both-with-adapter` | Create a case | Case name, description, customer; optional owner, reviewer, classification, template, SOC ID | Created case payload |
| Add Activity Log | `stable-only` | Add a case activity entry | Case ID, activity text | Activity response |
| Count Cases | `both-with-adapter` | Count cases matching filters | Filter fields such as customer, state, date, tags | Count summary |
| Delete | `both-with-adapter` | Delete a case | Case ID | Delete response |
| Export | `stable-only` | Export a case | Case ID | Export response or file metadata |
| Filter Cases | `both-with-adapter` | Search and paginate cases | Filters, start page, page size, return-all options | Matching case rows |
| Get Case Summary | `both-with-adapter` | Fetch one case summary | Case ID | Summary object |
| Update | `both-with-adapter` | Update core case fields | Case ID plus changed fields | Updated case payload |
| Update Case Summary | `both-with-adapter` | Update summary-focused fields | Case ID plus summary fields | Updated summary payload |

### Key Case Inputs

- `Case ID` for read/update/delete flows
- `Case Name`
- `Case Description`
- `Case Customer Name or ID`
- optional metadata such as owner, reviewer, classification, template, and state

### Case Notes

- `Filter Cases` is the main `Get Many` equivalent for cases
- `Next / Dev` supports the dual-mode case operations listed above, but not `Add Activity Log` or `Export`

## Alert

Use `Alert` for alert-centric stable workflows such as triage, escalation, merge, and batch operations.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `stable-only` | Create an alert | Alert title, description, source, customer, optional assets/IOCs | Created alert payload |
| Update | `stable-only` | Update alert fields | Alert ID plus changed fields | Updated alert |
| Get | `stable-only` | Fetch one alert | Alert ID | Alert object |
| Get Relations | `stable-only` | Fetch related entities for an alert | Alert ID | Relations payload |
| Count Alerts | `stable-only` | Count alerts by filters | Status, customer, source, owner, dates | Count summary |
| Delete | `stable-only` | Delete one alert | Alert ID | Delete response |
| Filter Alerts | `stable-only` | Search and paginate alerts | Filters, start page, page size, return-all options | Matching alert rows |
| Batch Update | `stable-only` | Update many alerts | Alert IDs plus update payload | Batch result |
| Batch Delete | `stable-only` | Delete many alerts | Alert IDs | Batch result |
| Escalate | `stable-only` | Turn an alert into a case-related flow | Alert ID and escalation fields | Escalation result |
| Merge | `stable-only` | Merge alerts | Source and target alert IDs | Merge result |
| Unmerge | `stable-only` | Undo a merge | Alert ID or merge context | Unmerge result |

### Key Alert Inputs

- `Alert ID` for single-alert operations
- `Alert IDs` for batch flows
- title, description, source, customer, owner, and optional linked assets or IOCs for creation

### Alert Notes

- Alerts are stable-only today
- If your workflow needs a route not exposed as a typed alert operation, use `API Request` in `Stable / Legacy` mode
