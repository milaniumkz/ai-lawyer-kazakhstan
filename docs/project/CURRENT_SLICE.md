# Current Slice

## Срез

Admin manual payment receipt import.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- `/api/v1/admin/subscriptions/payments/manual` imports a verified manual payment receipt.
- Admin route requires `x-user-role: admin|superadmin`.
- Service updates the user's subscription plan/monthly limit and writes a `paid` manual receipt.
- PostgreSQL repository inserts into `subscription_payments`.
- Admin shell has a userId field and button to add a standard manual payment.
- API, repository and public release smoke scripts cover receipt import and payment-history visibility.

## Следующий шаг

Next vertical slice: continue remaining web pixel screens above the 4% threshold.
