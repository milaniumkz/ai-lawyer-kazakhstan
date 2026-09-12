# Current Slice

## Срез

Web profile screen pixel completion.

## Статус

DONE locally -> ready for public deploy.

## Scope

- Screen `22 profile` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `22 profile`: 4.77% -> 2.36%.
- Profile mobile layout now uses the reference compact centered title, avatar, progress bar, profile cards, data/security rows and profile bottom nav.
- Profile actions remain functional: profile type switch persists, data/security rows call save/open state, and security routes to settings.
- Current web pixel status: 21 screens at or below 4%, 4 screens still above threshold.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: close `08 category` from 4.27% to the `<=4%` pixel threshold, then deploy the latest web bundle.
