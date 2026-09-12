# Current Slice

## Срез

Web biometric screen pixel completion.

## Статус

READY_FOR_COMMIT -> local visual/function gates passed.

## Scope

- Screen `05 biometric` now matches the dark PNG reference under the `<=4%` pixel threshold.
- Web mobile `mobile-ref-390` diff for `05 biometric`: 7.22% -> 3.54%.
- The screen has the reference-style top title/back action, Face ID mark, CTA spacing and no auth bottom nav.
- `Включить` persists the local biometric flag; `Позже` routes to the authenticated home screen.
- Current web pixel status: 14 screens at or below 4%, 11 screens still above threshold.

## Следующий шаг

Next vertical slice: close `02 login` from 6.75% to the `<=4%` pixel threshold.
