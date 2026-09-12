# Current Slice

## Срез

Web chat screen pixel completion.

## Статус

READY -> local gate passed; pending public deploy.

## Scope

- Screen `17 chat` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `17 chat`: 5.39% -> 3.91%.
- Visual runner now seeds authenticated case data for protected screens so chat opens as a real selected case, not an empty blocker.
- Chat UI now uses reference-style case header, AI/user bubbles, citation card, attachment action, document CTA and compact composer.
- Local Playwright smoke confirmed message input, send to `/api/v1/cases/:id/messages`, server response rendering, and document CTA route to `claim`.
- Current web pixel status: 18 screens at or below 4%, 7 screens still above threshold.
- `npm run check` and `npm run build` passed; `npm run docker:config` is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: deploy `17 chat`, then close `25 help` from 5.06% to the `<=4%` pixel threshold.
