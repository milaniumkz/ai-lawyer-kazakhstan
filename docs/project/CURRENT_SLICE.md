# Current Slice

## Срез

Web login screen pixel completion.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `02 login` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `02 login`: 6.75% -> 3.27%.
- The screen uses the reference welcome layout: back action, RU/KZ/EN switcher, login/register tabs and action rows.
- Phone login remains real: the phone row keeps `+7` normalization and calls `/api/v1/auth/register`; registration and biometric rows route to their screens.
- Current web pixel status: 15 screens at or below 4%, 10 screens still above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-login-screen-final.tar.gz`.

## Следующий шаг

Next vertical slice: close `04 otp` from 6.71% to the `<=4%` pixel threshold.
