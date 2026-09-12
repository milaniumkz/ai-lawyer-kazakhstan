# Current Slice

## Срез

Web chat screen pixel completion.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- Screen `17 chat` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `17 chat`: 5.39% -> 3.91%.
- Visual runner now seeds authenticated case data for protected screens so chat opens as a real selected case, not an empty blocker.
- Chat UI now uses reference-style case header, AI/user bubbles, citation card, attachment action, document CTA and compact composer.
- Local Playwright smoke confirmed message input, send to `/api/v1/cases/:id/messages`, server response rendering, and document CTA route to `claim`.
- Current web pixel status: 18 screens at or below 4%, 7 screens still above threshold.
- Public HTTPS server was refreshed from `/tmp/ai-lawyer-kz-chat-screen-final.tar.gz`.
- `PUBLIC_SERVER_URL=https://89-207-250-217.sslip.io npm run release-check:server` passed.
- Public Playwright smoke confirmed auth -> profile -> case -> chat message POST 201 -> claim route.

## Следующий шаг

Next vertical slice: close `25 help` from 5.06% to the `<=4%` pixel threshold.
