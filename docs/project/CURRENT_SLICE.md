# Current Slice

## Срез

Admin category review queue.

## Статус

READY_FOR_DEPLOY -> admin review API/UI implemented locally; deploy and public smoke pending.

## Scope

- `/api/v1/admin/legal-categories` under admin RBAC.
- `/api/v1/admin/classifications/review-queue` for unconfirmed, high-risk or incomplete classifications.
- `/api/v1/admin/classifications/:id/confirm`.
- `/api/v1/admin/classifications/:id/override` with expert feedback source.
- Admin UI buttons load categories, load review queue, confirm first item and run expert override.
- Release check no longer uses РФ legal entity form strings.

## Следующий шаг

Deploy admin review queue, run public smoke, then implement safe taxonomy CRUD/versioning.
