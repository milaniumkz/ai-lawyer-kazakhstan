# Architecture

## Контекст

AI-Юрист Казахстан работает только для Республики Казахстан и не заменяет юриста, суд или государственный орган. Юридически значимые ответы должны ссылаться на официальные источники РК либо возвращать safe refusal.

## Контейнеры

```mermaid
C4Container
title AI-Юрист Казахстан
Person(user, "Пользователь")
Person(expert, "Юридический эксперт")
System_Boundary(app, "AI-Юрист Казахстан") {
  Container(mobile, "Mobile", "Flutter", "Пользовательские сценарии")
  Container(admin, "Admin/Expert", "Next.js", "Операции, настройки, проверки")
  Container(api, "Core API", "NestJS", "Auth, дела, документы, аудит")
  Container(ai, "AI Service", "FastAPI", "RAG, маршрутизация, валидаторы")
  ContainerDb(db, "PostgreSQL + pgvector", "Data")
  Container(redis, "Redis", "Cache, locks, queues")
  Container(storage, "S3/MinIO", "Файлы")
}
System_Ext(sources, "Официальные источники РК")
System_Ext(gov, "Гос. сервисы РК")
Rel(user, mobile, "uses")
Rel(expert, admin, "reviews")
Rel(mobile, api, "REST/SSE")
Rel(admin, api, "REST")
Rel(api, ai, "internal REST")
Rel(api, db, "SQL")
Rel(api, redis, "queues/cache")
Rel(api, storage, "signed file access")
Rel(ai, sources, "official/manual ingestion")
Rel(api, gov, "assisted/official adapters")
```

## Trust Boundaries

- User/admin input, OCR, uploaded files, webhooks and retrieved legal text are untrusted.
- Backend enforces RBAC, ownership, idempotency and audit.
- AI receives masked PII where possible and never becomes source of law.
- Government integrations default to `assisted` unless official API access is documented.
