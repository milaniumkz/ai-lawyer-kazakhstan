# Current Slice

## Срез

Admin category review queue.

## Статус

DONE -> admin review API/UI deployed; public smoke passed.

## Scope

- `/api/v1/admin/legal-categories` under admin RBAC.
- `/api/v1/admin/classifications/review-queue` for unconfirmed, high-risk or incomplete classifications.
- `/api/v1/admin/classifications/:id/confirm`.
- `/api/v1/admin/classifications/:id/override` with expert feedback source.
- Admin UI buttons load categories, load review queue, confirm first item and run expert override.
- Release check no longer uses РФ legal entity form strings.

## Следующий шаг

Implement safe taxonomy CRUD/versioning.
