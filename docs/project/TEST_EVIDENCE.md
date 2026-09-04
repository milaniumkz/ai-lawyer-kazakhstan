# Test Evidence

Дата: 2026-09-04.

## Выполнено

- `pwd` — рабочая директория подтверждена.
- `git status --short --branch` — репозиторий без коммитов, исходные файлы untracked.
- `git log --oneline -15` — недоступен, потому что коммитов еще нет.
- `find . -name AGENTS.md -print` — `AGENTS.md` в проекте не найден.
- `dart --version` — Dart SDK 3.10.7 доступен.
- `node --version && npm --version` — Node v24.10.0, npm 11.6.0 доступны.
- `python3 --version` — Python 3.11.9 доступен.
- `/Volumes/PD1000/job/flutter/bin/flutter --version` — Flutter 3.41.1 доступен.
- `npm install` — зависимости установлены, создан lock-файл; npm сообщил 2 уязвимости.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- OpenAPI YAML parse via Node parser — passed.
- Identity API unit tests — passed, 5 tests for OTP, refresh rotation, masking, rate limit, invalid input.
- Case/chat API unit tests — passed, 4 tests for classification, idempotency, safe assistant fallback, transcript states.
- AI classifier unittest — passed, 2 tests for alimony and low-confidence escalation.
- Documents API unit tests — passed, 5 tests for upload session, OCR confirmation, unsafe file rejection, duplicate hash, evidence folder.
- AI OCR unittest — passed, review-required OCR stub.
- Legal RAG API unit tests — passed, 4 tests for official import, citation validation, safe refusal, stale/future edition rejection.
- AI RAG unittest — passed, safe refusal without confirmed source.
- Template API unit tests — passed, 2 tests for draft generation and required fields.
- Flutter widget tests — passed, 6 tests for home, login route, case intake, documents OCR, legal citation and pretrial claim screen.
- `npm test` — passed, 1 API test.
- `/Volumes/PD1000/job/flutter/bin/flutter analyze` — passed.
- `/Volumes/PD1000/job/flutter/bin/flutter test` — passed, 1 widget test.
- `python3 -m py_compile services/ai/app/main.py` — passed.

## Заблокировано

- `docker --version` — `docker: command not found`.
- `npm audit --json` — не вернул результат за 20 секунд; известно из `npm install`: 2 уязвимости.

## Не запускалось

- `pytest`, `ruff`, `mypy` — зависимости AI service еще не установлены.
