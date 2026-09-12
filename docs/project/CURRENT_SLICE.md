# Current Slice

## Срез

Web profile screen pixel completion.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `22 profile` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `22 profile`: 4.77% -> 2.36%.
- Profile mobile layout now uses the reference compact centered title, avatar, progress bar, profile cards, data/security rows and profile bottom nav.
- Profile actions remain functional: profile type switch persists, data/security rows call save/open state, and security routes to settings.
- Current web pixel status: 21 screens at or below 4%, 4 screens still above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-profile-screen-final.tar.gz`.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
- Public Playwright smoke confirmed profile type switch, data/security section state and settings route.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: close `08 category` from 4.27% to the `<=4%` pixel threshold, then deploy the latest web bundle.
