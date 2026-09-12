# Current Slice

## Срез

Web claim send screen pixel completion.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `14 claimSend` now matches the dark PNG reference under the `<=4%` pixel threshold with margin.
- Web mobile `mobile-ref-390` diff for `14 claimSend`: 4.003% -> 3.852% (`3.85%` in report).
- Attachment download control now matches the PNG as a gold inline icon instead of a white square.
- Claim-send state is persisted: generated claim readiness and user-confirmed send status survive reloads.
- Claim-send actions remain functional: channel selection, contact edit, message edit, send confirmation and draft save all update real local state.
- Current web pixel status: 25 screens at or below 4%, 0 screens above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-claim-send-final-margin.tar.gz`.
- Archive SHA-256: `bf57268b49eb5f73d5d2ba7cfdd99e604743ae4656b1a584c956015d4028536c`.
- Server install health passed, server `npm run test:audit` found 0 vulnerabilities.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
- Public Playwright smoke confirmed channel, contact, message, send and draft actions.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: continue near-threshold polish starting with `20 legalSearch` at 3.99% if more visual margin is required, or move to Flutter parity/release packaging.
