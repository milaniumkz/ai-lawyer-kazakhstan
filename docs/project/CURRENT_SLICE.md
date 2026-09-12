# Current Slice

## Срез

Web visual screenshot auth seed.

## Статус

READY_FOR_COMMIT -> local visual gate corrected and rerun.

## Scope

- `scripts/web/check-screenshots.mjs` seeds auth/profile state for protected web screens.
- Public auth screens remain unauthenticated in the visual runner.
- Full web screenshot strict pass writes 180 dark/light desktop/mobile baselines.
- `docs/project/WEB_PIXEL_DIFF.md` reflects protected screens themselves instead of login redirects.
- Current web pixel status: 13 screens at or below 4%, 12 screens still above threshold.

## Следующий шаг

Next vertical slice: close `05 biometric` from 7.22% to the `<=4%` pixel threshold.
