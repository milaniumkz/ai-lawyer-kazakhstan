# Current Slice

## Срез

Web register screen pixel completion.

## Статус

READY -> local gate passed; pending public deploy.

## Scope

- Screen `03 register` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `03 register`: 5.71% -> 3.58%.
- Registration keeps real controlled fields for first name, last name, middle name, city and optional IIN/BIN validation.
- The CTA now matches the design label `Создать аккаунт` while still calling `/api/v1/profiles`.
- Local Playwright smoke confirmed input, profile type toggle, API submit to `/api/v1/profiles`, success route to `home`, and login-link route.
- Current web pixel status: 17 screens at or below 4%, 8 screens still above threshold.
- `npm run check` and `npm run build` passed; `npm run docker:config` is blocked locally because Docker CLI is not installed.

## Следующий шаг

Next vertical slice: deploy `03 register`, then close `17 chat` from 5.39% to the `<=4%` pixel threshold.
