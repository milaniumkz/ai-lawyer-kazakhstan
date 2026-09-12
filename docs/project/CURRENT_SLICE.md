# Current Slice

## Срез

Web settings screen pixel completion.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `23 settings` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `23 settings`: 4.05% -> 1.91%.
- Settings layout now uses the compact reference-style header, grouped rows, small toggles and profile bottom navigation.
- Settings actions remain functional: theme switch persists, voice alert toggle persists, privacy masking toggle persists, language action reports state.
- Current web pixel status: 24 screens at or below 4%, 1 screen still above/at rounded threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-settings-screen-final.tar.gz`.
- Archive SHA-256: `b26a9dcade6b51ca78df176bf9be5d96dd58ba72eba69174d1bde3f294845a1e`.
- Server install health passed, server `npm run test:audit` found 0 vulnerabilities.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
- Public Playwright smoke confirmed theme switch, persisted toggles and language action.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: close `14 claimSend` from rounded 4.00% to clearly below the `<=4%` pixel threshold, then deploy the latest web bundle.
