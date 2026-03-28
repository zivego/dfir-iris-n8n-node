# Comments, Notes, Evidence, and Timeline

## Comment

Use `Comment` to manage case comments.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `stable-only` | Add a comment | Case ID, comment text | Created comment |
| Delete | `stable-only` | Delete a comment | Case ID, comment ID | Delete response |
| Get Many | `stable-only` | List comments | Case ID | Comment rows |
| Update | `stable-only` | Update a comment | Case ID, comment ID, new text | Updated comment |

## Note Group

Use `Note Group` to manage note directories inside a case.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `stable-only` | Create a note group | Case ID, group name | Created group |
| Delete | `stable-only` | Delete a note group | Case ID, note group ID | Delete response |
| Get Many | `stable-only` | List note groups | Case ID | Group rows |
| Update | `stable-only` | Rename or update a note group | Case ID, note group ID, new values | Updated group |

## Note

Use `Note` to manage notes within a case or note group.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `stable-only` | Create a note | Case ID, note title/content, optional note group | Created note |
| Delete | `stable-only` | Delete a note | Case ID, note ID | Delete response |
| Get | `stable-only` | Fetch one note | Case ID, note ID | Note object |
| Search | `stable-only` | Search notes | Case ID, search text | Matching note rows |
| Update | `stable-only` | Update a note | Case ID, note ID, changed content | Updated note |

## Evidence

Use `Evidence` to manage case evidence records and binary attachments.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add | `stable-only` | Create evidence | Case ID, evidence metadata, optional binary upload | Created evidence |
| Delete | `stable-only` | Delete evidence | Case ID, evidence ID | Delete response |
| Get | `stable-only` | Fetch one evidence record | Case ID, evidence ID | Evidence object |
| Get Many | `stable-only` | List evidence records | Case ID | Evidence rows |
| Update | `stable-only` | Update evidence metadata or file data | Case ID, evidence ID, changed values | Updated evidence |

### Evidence Notes

- Evidence creation and update can use binary data from an input item
- Provide a valid binary property name when uploading from previous workflow steps

## Timeline

Use `Timeline` to manage case timeline events.

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Add Event | `stable-only` | Create a timeline event | Case ID, event text, event date/time, optional tags | Created event |
| Query Timeline | `stable-only` | Search or list events | Case ID, filters, pagination options | Event rows |
| Delete Event | `stable-only` | Delete an event | Case ID, event ID | Delete response |
| Get Event | `stable-only` | Fetch one event | Case ID, event ID | Event object |
| Flag Event | `stable-only` | Flag or mark an event | Case ID, event ID | Updated event state |
| Update Event | `stable-only` | Update event fields | Case ID, event ID, changed fields | Updated event |
| Get Timeline State | `stable-only` | Fetch timeline state information | Case ID | Timeline state payload |
