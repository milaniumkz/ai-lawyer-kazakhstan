# Current Slice

## Срез

Web case detail screen pixel polish.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `16 case` now has more margin under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `16 case`: 3.97% -> 3.92%.
- Mobile case hero no longer shows the extra standalone progress percentage; readiness remains in the dedicated metric card.
- Case actions remain functional: progress documents route, claim route, chat continuation and open-documents route.
- Current web pixel status: 25 screens at or below 4%, 0 screens above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-case-detail-polish.tar.gz`.
- Archive SHA-256: `e886e29c96d60184d6a3935fa55481f18e34ae75d8dccb7282ad246278581fba`.
- Server install health passed, server `npm run test:audit` found 0 vulnerabilities.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
- Public Playwright smoke confirmed documents, claim and chat routes.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: continue near-threshold polish starting with `20 legalSearch` or `10 documentUpload` if more visual margin is required.
