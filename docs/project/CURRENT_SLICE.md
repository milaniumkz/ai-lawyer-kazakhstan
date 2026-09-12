# Current Slice

## Срез

Web new case screen pixel completion.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `07 newCase` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `07 newCase`: 4.23% -> 3.12%.
- Visual runner now restores active voice-intake state for the reference screen: recording, 47 seconds, confirmed text and live recognition status.
- New case actions remain functional: pause/resume work in restored state, finish saves text without fake audio upload and routes to category.
- Current web pixel status: 23 screens at or below 4%, 2 screens still above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-new-case-screen-final.tar.gz`.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
- Public Playwright smoke confirmed pause, resume and finish-to-category behavior.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: close `23 settings` from 4.05% to the `<=4%` pixel threshold, then deploy the latest web bundle.
