# Current Slice

## Срез

Определение категории спора после auth gate.

## Статус

READY_FOR_QA -> backend/API/web/Flutter classification lifecycle implemented; production deployment and public smoke pending.

## Scope

- `legal_categories` taxonomy table.
- `case_classifications` saved structured results.
- `classification_feedback` user/expert corrections.
- `/api/v1/legal-categories`, `/api/v1/legal-categories/tree`.
- `/api/v1/ai/classifications` lifecycle.
- Web category screen calls classification API and confirms before case creation.
- Flutter category screen calls classification API, shows confidence/risk/missing facts, confirms and creates case after category confirmation.

## Следующий шаг

Deploy server, run public smoke, then implement admin category CRUD.
