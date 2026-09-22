from dataclasses import dataclass
import json
import os
from urllib import request as urllib_request
from urllib.error import URLError


@dataclass(frozen=True)
class RagAnswer:
    status: str
    message: str
    required_action: str | None = None
    provider: str | None = None
    model_id: str | None = None


def safe_answer(
    has_confirmed_source: bool,
    query: str = "",
    source_text: str = "",
    source_url: str = "",
) -> RagAnswer:
    if not has_confirmed_source:
        return RagAnswer(
            status="insufficient_authoritative_sources",
            message="В официальных источниках не найдено достаточного подтверждения для точного ответа.",
            required_action="clarify_or_human_review",
        )
    if _openai_enabled():
        try:
            generated = _openai_answer(query=query, source_text=source_text, source_url=source_url)
            return RagAnswer(
                status="confirmed",
                message=generated["message"],
                provider="openai",
                model_id=generated["model_id"],
            )
        except (RuntimeError, URLError, TimeoutError):
            return RagAnswer(
                status="confirmed",
                message=(
                    "Официальный источник подтвержден. AI-провайдер временно недоступен, "
                    "вывод требует ручной проверки применимости к фактам."
                ),
                required_action="clarify_or_human_review",
            )
    return RagAnswer(
        status="confirmed",
        message="Ответ может быть показан только вместе с подтвержденной цитатой из официального источника РК.",
    )


def _openai_enabled() -> bool:
    return os.getenv("AI_PROVIDER", "").lower() == "openai" and bool(_api_key())


def _api_key() -> str:
    return os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY") or ""


def _openai_answer(query: str, source_text: str, source_url: str) -> dict[str, str]:
    model = os.getenv("AI_COMPLEX_MODEL") or os.getenv("AI_MEDIUM_MODEL") or os.getenv("OPENAI_MODEL") or "gpt-5"
    base_url = os.getenv("AI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    payload = {
        "model": model,
        "store": False,
        "input": [
            {
                "role": "developer",
                "content": (
                    "Ты AI-юрист для Казахстана. Отвечай только по переданному официальному источнику РК. "
                    "Не используй право РФ и не выдумывай нормы."
                ),
            },
            {
                "role": "user",
                "content": "\n".join(
                    [
                        f"Вопрос пользователя: {query}",
                        f"Официальный источник: {source_url}",
                        f"Текст источника: {source_text}",
                        'Сформируй краткий ответ и добавь строку "Источник:" с URL.',
                    ]
                ),
            },
        ],
    }
    http_request = urllib_request.Request(
        f"{base_url}/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib_request.urlopen(http_request, timeout=float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "20"))) as response:
        body = json.loads(response.read().decode("utf-8"))
    output_text = body.get("output_text") or "".join(
        content.get("text", "")
        for item in body.get("output", [])
        for content in item.get("content", [])
    )
    if not output_text.strip():
        raise RuntimeError("OPENAI_EMPTY_OUTPUT")
    return {"message": output_text.strip(), "model_id": model}
