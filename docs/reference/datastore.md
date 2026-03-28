# Datastore

Use the datastore resources to manage folders and files attached to a case in the stable API surface.

## Datastore Folder

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Get Tree | `stable-only` | Fetch the folder tree for a case | Case ID | Folder tree |
| Add | `stable-only` | Create a folder | Case ID, parent folder, folder name | Created folder |
| Move | `stable-only` | Move a folder | Case ID, folder ID, destination folder | Move result |
| Rename | `stable-only` | Rename a folder | Folder name or ID, new folder name | Rename result |
| Delete | `stable-only` | Delete a folder | Case ID, folder ID | Delete response |

## Datastore File

| Operation | Compatibility | What it does | Typical inputs | Returns |
| --- | --- | --- | --- | --- |
| Upload | `stable-only` | Upload a file into the datastore | Case ID, target folder, binary input, optional metadata | Uploaded file metadata |
| Get | `stable-only` | Fetch file metadata | Case ID, file ID | File info |
| Update | `stable-only` | Update file metadata | Case ID, file ID, changed fields | Updated metadata |
| Download | `stable-only` | Download a file as binary | Case ID, file ID, output binary field, optional filename override | Binary output |
| Move | `stable-only` | Move a file | Case ID, file ID, destination folder | Move result |
| Delete | `stable-only` | Delete a file | Case ID, file ID | Delete response |

## Datastore Notes

- `Download` supports a user-supplied output filename, response-header filename, or a safe fallback name
- `Upload` requires a valid input binary property from an earlier workflow node
- These datastore operations are stable-only today
