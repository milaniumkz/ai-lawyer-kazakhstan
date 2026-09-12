# Current Slice

## Срез

Subscription/payment adapter hardening.

## Статус

READY_FOR_DEPLOY -> local gate passed; Docker gate unavailable locally.

## Scope

- `/api/v1/subscriptions/plans` returns user-scoped plan definitions.
- `/api/v1/subscriptions/payment-history` returns current user's stored payment receipts from `subscription_payments`.
- `/api/v1/subscriptions/payment-intent` returns a documented `PAYMENT_PROVIDER_REQUIRED` blocker until production provider env is configured.
- PostgreSQL migration `0009_subscription_payments.sql` adds payment history storage.
- Web and Flutter subscription screens load plans/history from API and call the payment-intent blocker.
- Admin shell can load subscription plans for operations visibility.
- API, repository, web, admin, Flutter and public release smoke scripts cover the new routes.

## Следующий шаг

Deploy subscription/payment hardening to the public server, apply migration `0009`, run public smoke, then continue remaining web pixel screens above the 4% threshold.
