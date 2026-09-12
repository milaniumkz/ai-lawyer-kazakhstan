# Current Slice

## Срез

Subscription/payment adapter hardening.

## Статус

DONE -> deployed to public server; migration `0009` applied; public smoke passed.

## Scope

- `/api/v1/subscriptions/plans` returns user-scoped plan definitions.
- `/api/v1/subscriptions/payment-history` returns current user's stored payment receipts from `subscription_payments`.
- `/api/v1/subscriptions/payment-intent` returns a documented `PAYMENT_PROVIDER_REQUIRED` blocker until production provider env is configured.
- PostgreSQL migration `0009_subscription_payments.sql` adds payment history storage.
- Web and Flutter subscription screens load plans/history from API and call the payment-intent blocker.
- Admin shell can load subscription plans for operations visibility.
- API, repository, web, admin, Flutter and public release smoke scripts cover the new routes.

## Следующий шаг

Next vertical slice: continue remaining web pixel screens above the 4% threshold or harden admin manual payment receipt import.
