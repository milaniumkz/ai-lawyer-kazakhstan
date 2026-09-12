# Current Slice

## Срез

Определение категории спора после auth gate.

## Статус

PARTIAL -> backend/API implemented locally; full web/mobile visual QA and production deployment pending.

## Scope

- `legal_categories` taxonomy table.
- `case_classifications` saved structured results.
- `classification_feedback` user/expert corrections.
- `/api/v1/legal-categories`, `/api/v1/legal-categories/tree`.
- `/api/v1/ai/classifications` lifecycle.
- Web category screen calls classification API and confirms before case creation.

## Следующий шаг

Прогнать полный `npm run check`, затем web browser smoke и Flutter parity для category screen.
