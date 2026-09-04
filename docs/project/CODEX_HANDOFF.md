# Codex Handoff

Дата: 2026-09-04.

## Выполнено

- Прочитан корневой `CODEX_RELEASE_MASTER_PROMPT_AI_Юрист.md` до раздела AI/RAG.
- Подтверждено: `AGENTS.md` внутри проекта нет.
- Подтверждено: проект был пустым, кроме master prompt и дизайн PNG.
- Создан базовый монорепозиторий по целевой структуре.
- Добавлены initial design tokens для светлой и темной темы.
- Добавлены стартовые health endpoints для API и AI service.
- Добавлен OpenAPI `/health`.
- Добавлены Flutter widget test и NestJS unit test.
- Добавлены release/status/test/blocker документы.
- Дочитан master prompt до конца.
- Добавлены `AGENTS.md`, `.env.example`, `Makefile`, root release scripts и GitHub Actions CI.
- Добавлены project docs: architecture, acceptance criteria, AI routing, integrations, security, work plan.
- Исправлен Next ESLint warning через локальный admin ESLint config.
- Реализован P0-002 local/stub identity slice: phone/email OTP, refresh rotation, logout all, sessions, profiles, audit events, IIN/BIN masking.
- Добавлены Flutter экраны входа, OTP и профиля.
- Admin dashboard показывает identity audit event classes.
- Реализован P0-003 local/stub case/chat/voice intake slice: cases, messages, idempotency, transcript jobs, progress statuses, AI classifier stub.
- Добавлены Flutter экраны нового дела и чата по делу.
- Admin dashboard показывает case/chat/voice status classes.
- Реализован P0-004 local/stub documents/evidence/OCR slice: upload sessions, document metadata, OCR confirmation, evidence folders, file allowlist, duplicate hash checks.
- Добавлен FastAPI OCR stub и Flutter documents/OCR screen.

## Дизайн-источник

- Темная тема: `дизайн/темная/*.png`, 25 экранов, 941×1672 px.
- Светлая тема: `дизайн/светлая /*.png`, 20 PNG, 941×1672 px.
- В UI нельзя использовать PNG как фон вместо нативных компонентов.

## Проверки

- Node, npm, Dart, Python и Flutter SDK доступны.
- Flutter SDK находится в `/Volumes/PD1000/job/flutter/bin/flutter`.
- `npm run check`, `npm run build`, `python3 -m py_compile services/ai/app/main.py` прошли.
- Docker отсутствует в окружении.
- `npm install` сообщает 2 уязвимости; `npm audit --json` не вернул результат за 20 секунд.

## Следующая задача

Реализовать P0-005: Legal RAG + anti-hallucination с source model, manual ingestion, citation validator, safe refusal, Flutter/admin citation visibility и тестами.
