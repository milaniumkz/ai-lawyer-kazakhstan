# Current Slice

## Срез

Safe taxonomy CRUD/versioning.

## Статус

READY_FOR_DEPLOY -> safe taxonomy change requests implemented locally; deploy and public smoke pending.

## Scope

- `legal_category_change_requests` migration.
- `/api/v1/admin/legal-categories/change-requests` list/create.
- `/api/v1/admin/legal-categories/change-requests/:id/approve`.
- `/api/v1/admin/legal-categories/change-requests/:id/reject`.
- DB-first category listing with local fallback.
- Admin UI create/update request, list, approve and reject actions.
- Release smoke covers safe taxonomy create/approve.

## Следующий шаг

Deploy safe taxonomy change requests, apply migration 0008, run public smoke.
