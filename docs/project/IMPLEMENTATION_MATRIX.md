# Implementation Matrix

| ID | Экран или модуль | UI | Навигация | API | БД | Логика | Тесты | Макет | Статус |
| -- | ---------------- | -- | --------- | --- | -- | ------ | ----- | ----- | ------ |
| AUTH-01 | Onboarding/auth/OTP/profile gate | Web/Flutter есть | Защищенные маршруты через auth gate | `/auth/*`, `/profiles` | `users`, `sessions`, `profiles` | OTP local adapter, profileRequired | Unit/widget/smoke есть | dark/light refs | DONE |
| CAT-01 | Legal category taxonomy | n/a | n/a | `/legal-categories`, `/legal-categories/tree` | `legal_categories` | KZ tree, high-risk flags | API/contract/migration | n/a | READY_FOR_QA |
| CAT-02 | Classification API | n/a | n/a | `/ai/classifications/*`, `/cases/:id/classification` | `case_classifications`, `classification_feedback` | language, facts, risk, alternatives, clarifications, confirm, override | 22 examples + smoke | n/a | READY_FOR_QA |
| CAT-03 | Web category screen | Implemented | `newCase -> category -> case` | classification/confirm/override | via API | shows confidence, alternatives, missing facts, high-risk | `npm run check` | light KZ style via tokens | READY_FOR_QA |
| CAT-04 | Flutter category parity | Implemented | text confirm -> category -> case details | classification/confirm/create case | via API | confidence, missing facts, risk, manual override | Flutter analyze/test 33 passed | light/dark refs | READY_FOR_QA |
| ADMIN-01 | Category admin | Not implemented | n/a | pending admin endpoints | DB ready | CRUD/version/statistics pending | pending | admin tokens | NOT_STARTED |
