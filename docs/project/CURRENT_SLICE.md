# Current Slice

## Срез

Web settings screen pixel completion.

## Статус

DONE locally -> ready for commit/deploy.

## Scope

- Screen `23 settings` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `23 settings`: 4.05% -> 1.91%.
- Settings layout now uses the compact reference-style header, grouped rows, small toggles and profile bottom navigation.
- Settings actions remain functional: theme switch persists, voice alert toggle persists, privacy masking toggle persists, language action reports state.
- Current web pixel status: 24 screens at or below 4%, 1 screen still above/at rounded threshold.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: close `14 claimSend` from rounded 4.00% to clearly below the `<=4%` pixel threshold, then deploy the latest web bundle.
