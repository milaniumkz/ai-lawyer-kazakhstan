# Current Slice

## Срез

Safe taxonomy CRUD/versioning.

## Статус

DONE -> safe taxonomy change requests deployed; public smoke passed.

## Scope

- `legal_category_change_requests` migration.
- `/api/v1/admin/legal-categories/change-requests` list/create.
- `/api/v1/admin/legal-categories/change-requests/:id/approve`.
- `/api/v1/admin/legal-categories/change-requests/:id/reject`.
- DB-first category listing with local fallback.
- Admin UI create/update request, list, approve and reject actions.
- Release smoke covers safe taxonomy create/approve.

## Следующий шаг

Next vertical slice: admin hardening for taxonomy changes audit/detail view or move to next RC gap.
