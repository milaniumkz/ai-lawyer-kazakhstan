# Current Slice

## Срез

Taxonomy change request detail/audit.

## Статус

DONE -> change request detail endpoint/UI deployed; public smoke passed.

## Scope

- `/api/v1/admin/legal-categories/change-requests/:id` detail endpoint.
- Admin UI opens first request details and renders id/action/category/status/requestedBy/reviewedBy/reason/payload.
- API smoke covers RBAC and detail response.
- Public release smoke covers approved request details.

## Следующий шаг

Next vertical slice: choose next RC gap from documents/evidence admin queue or subscription/budget hardening.
