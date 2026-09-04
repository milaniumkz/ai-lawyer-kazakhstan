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
- `npm run build` — passed; Next предупредил, что Next ESLint plugin не подключен к базовой flat config.
- `npm test` — passed, 1 API test.
- `/Volumes/PD1000/job/flutter/bin/flutter analyze` — passed.
- `/Volumes/PD1000/job/flutter/bin/flutter test` — passed, 1 widget test.
- `python3 -m py_compile services/ai/app/main.py` — passed.

## Заблокировано

- `docker --version` — `docker: command not found`.
- `npm audit --audit-level=moderate` — зависал без вывода и был остановлен; известно из `npm install`: 2 уязвимости.

## Не запускалось

- `pytest`, `ruff`, `mypy` — зависимости AI service еще не установлены.
