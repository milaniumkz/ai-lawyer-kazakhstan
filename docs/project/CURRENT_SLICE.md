# Current Slice

## Срез

Web OTP screen regression recovery.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `04 otp` recovered under the dark PNG `<=4%` pixel threshold after the chat screen data-seed correction exposed a regression.
- Web mobile `mobile-ref-390` diff for `04 otp`: 6.13% -> 3.19%.
- OTP keeps the real flow: phone state, hidden native SMS input, six visible code cells, visible local test SMS code in real auth flow, and route back to login.
- Visual baselines hide the local test-code pill only for PNG comparison because the reference screen has no runtime SMS helper.
- Local Playwright smoke confirmed SMS input fills all six cells and `Изменить номер` routes to `login`.
- Current web pixel status: 19 screens at or below 4%, 6 screens still above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-otp-recovery-final.tar.gz`.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
- Public Playwright smoke confirmed login -> OTP, visible test SMS code, six-box input and change-phone route.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: close `25 help` from 5.06% to the `<=4%` pixel threshold, then deploy the latest web bundle.
