# Current Slice

## Срез

Web case detail screen pixel polish.

## Статус

DONE locally -> ready for commit/deploy.

## Scope

- Screen `16 case` now has more margin under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `16 case`: 3.97% -> 3.92%.
- Mobile case hero no longer shows the extra standalone progress percentage; readiness remains in the dedicated metric card.
- Case actions remain functional: progress documents route, claim route, chat continuation and open-documents route.
- Current web pixel status: 25 screens at or below 4%, 0 screens above threshold.
- `npm run check` and root `npm run build` passed.
- Docker config is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: deploy `16 case`, then continue near-threshold polish starting with `20 legalSearch` or `10 documentUpload` if more visual margin is required.
