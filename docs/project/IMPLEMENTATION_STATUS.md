# Implementation Status

Дата аудита: 2026-09-04.

| Требование | Реализация | Тест | Статус |
|---|---|---|---|
| Монорепозиторий `apps/mobile`, `apps/admin`, `services/api`, `services/ai`, `packages/contracts`, `infra`, `docs` | Создан базовый каркас, root scripts, CI, env template, AGENTS | `npm run check`, `npm run build` passed | done |
| Default светлая premium Kazakhstan theme + dark theme | Токены добавлены в Flutter и admin CSS/TS | Визуальная проверка по дизайн PNG частичная | in_progress |
| Flutter mobile app | Добавлен минимальный entrypoint, главный экран и widget test | `flutter analyze`, `flutter test` passed через `/Volumes/PD1000/job/flutter/bin/flutter` | in_progress |
| Next.js admin | Добавлена стартовая панель | `npm run typecheck`, `npm run build` passed | in_progress |
| NestJS API | Добавлен `/api/v1/health` и unit test | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` passed | in_progress |
| FastAPI AI service | Добавлен `/health` | `python3 -m py_compile services/ai/app/main.py` passed | in_progress |
| OpenAPI | Добавлен контракт `/health` | Проверяется следующими contract tests в P0-002 | in_progress |
| Docker Compose PostgreSQL/Redis/MinIO | Добавлен `infra/docker-compose.yml` | Заблокировано: Docker не установлен | in_progress |
| Identity auth/profile P0 | OpenAPI auth/profile/sessions/audit, NestJS local OTP/session/profile service, Flutter login/OTP/profile screens, admin audit visibility | `npm run check`, `npm run build`, OpenAPI YAML parse passed | done |
| Case/chat/voice intake P0 | OpenAPI cases/messages/voice transcripts, NestJS local case/message/transcript service, FastAPI classifier stub, Flutter case/chat screens, admin visibility | `npm run check`, `npm run build`, AI unittest, OpenAPI YAML parse passed | done |
| Documents/evidence/OCR P0 | OpenAPI upload/documents/evidence/OCR confirmation, NestJS local metadata service with allowlist/duplicate checks, FastAPI OCR stub, Flutter documents/OCR screen, admin visibility | `npm run check`, `npm run build`, AI unittest, OpenAPI YAML parse passed | done |
| Legal RAG/anti-hallucination P0 | OpenAPI legal source manual import/search/citation validation/RAG answer, NestJS official-source guardrails, FastAPI safe answer stub, Flutter legal source screen, admin visibility | `npm run check`, `npm run build`, AI unittest, OpenAPI YAML parse passed | done |
| Legal workflows/document builder P1 | OpenAPI templates/document generation, NestJS local versioned template engine, dосудебная претензия draft, required fields, unresolved placeholder guard, expert review flag, Flutter builder screen, admin visibility | `npm run check`, `npm run build`, OpenAPI YAML parse passed | done |
| Subscriptions/budget/admin P1 | OpenAPI subscriptions/AI usage/providers, NestJS local usage ledger, budget thresholds, TTS disable flag, provider kill switch, Flutter subscription screen, admin visibility | `npm run check`, `npm run build`, OpenAPI YAML parse passed | done |

## Блокеры окружения

- `docker` не установлен.
- `npm install` сообщает 2 уязвимости в dependency tree; `npm audit --json` не вернул результат за 20 секунд.
