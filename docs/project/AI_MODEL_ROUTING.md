# AI Model Routing

## Principle

Business logic never hardcodes provider model IDs. Runtime config maps aliases:

- `simple`
- `medium`
- `complex`
- `human_review_required`

## Signals

Routing uses category, risk, document count, context size, deadline presence, contradictions, transcript confidence, source confidence and submission/signature intent.

## Required Behavior

- Low confidence escalates upward.
- High-risk final conclusions require complex model or human review.
- No authoritative source returns `insufficient_authoritative_sources`.
- Usage logs store model alias, units, duration, estimated cost, complexity, risk and correlation IDs without raw PII.

## OpenAI Provider

- Enable with `AI_PROVIDER=openai`.
- Store the secret only in runtime env: `AI_API_KEY` or `OPENAI_API_KEY`.
- Model selection stays runtime-configured through `AI_COMPLEX_MODEL`, `AI_MEDIUM_MODEL` or `OPENAI_MODEL`.
- Default base URL: `AI_BASE_URL=https://api.openai.com/v1`.
- Backend `/api/v1/rag/answer` calls OpenAI only after an official Kazakhstan source is found and sends `store=false`.
- Without a confirmed official source the system returns `insufficient_authoritative_sources` and does not call OpenAI.
- Server AI service reads `/etc/ai-lawyer-ai.env`; API service reads `/etc/ai-lawyer-api.env`.
