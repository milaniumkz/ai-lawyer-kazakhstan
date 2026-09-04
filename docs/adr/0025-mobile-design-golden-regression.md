# ADR 0025: Mobile Design Golden Regression

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Design references contain light and dark mobile PNGs. The app needs automated regression coverage so theme/layout changes do not drift silently.

## Решение

- `AiLawyerApp` now accepts `themeMode` for deterministic tests; production default remains `ThemeMode.system`.
- Added Flutter golden snapshots for home screen in light and dark themes at reference viewport `941x1672`.
- Added core release screen render smoke test across light and dark themes.

## Последствия

- Mobile design regressions are now caught by `flutter test`.
- This is regression coverage for implemented native UI, not a claim of full pixel-perfect parity with every reference PNG.
