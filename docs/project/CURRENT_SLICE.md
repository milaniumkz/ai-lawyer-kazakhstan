# Current Slice

## Срез

Web OTP screen pixel completion.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `04 otp` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `04 otp`: 6.71% -> 3.95%.
- OTP now restores persisted phone/code/test hint for reload-safe auth state and visual checks.
- The screen has the reference top title/back action, visible test SMS code, SMS code cells, countdown, confirm CTA and no bottom nav.
- `Код из SMS` input fills the six visible cells; `Изменить номер` returns to login; confirm still calls `/api/v1/auth/otp/verify`.
- Current web pixel status: 16 screens at or below 4%, 9 screens still above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-otp-visible-code-final.tar.gz`.

## Следующий шаг

Next vertical slice: close `03 register` from 5.71% to the `<=4%` pixel threshold.
