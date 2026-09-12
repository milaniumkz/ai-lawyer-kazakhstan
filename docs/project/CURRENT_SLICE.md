# Current Slice

## Срез

Web help screen pixel completion.

## Статус

DONE locally -> ready for public deploy.

## Scope

- Screen `25 help` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `25 help`: 5.06% -> 3.87%.
- Help mobile layout now uses the reference compact header/search, quick actions, online support card, help section rows and profile bottom nav.
- Help actions remain functional: search clear, quick action state, support request creation and help section state persist locally.
- Current web pixel status: 20 screens at or below 4%, 5 screens still above threshold.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: close `22 profile` from 4.77% to the `<=4%` pixel threshold, then deploy the latest web bundle.
