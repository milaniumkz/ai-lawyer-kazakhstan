# Current Slice

## Срез

Taxonomy change request detail/audit.

## Статус

READY_FOR_DEPLOY -> change request detail endpoint/UI implemented locally; deploy and public smoke pending.

## Scope

- `/api/v1/admin/legal-categories/change-requests/:id` detail endpoint.
- Admin UI opens first request details and renders id/action/category/status/requestedBy/reviewedBy/reason/payload.
- API smoke covers RBAC and detail response.
- Public release smoke covers approved request details.

## Следующий шаг

Deploy detail/audit endpoint and run public smoke.
