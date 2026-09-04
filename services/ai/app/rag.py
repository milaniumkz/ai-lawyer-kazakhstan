from dataclasses import dataclass


@dataclass(frozen=True)
class RagAnswer:
    status: str
    message: str
    required_action: str | None = None


def safe_answer(has_confirmed_source: bool) -> RagAnswer:
    if has_confirmed_source:
        return RagAnswer(
            status="confirmed",
            message="Ответ может быть показан только вместе с подтвержденной цитатой из официального источника РК.",
        )
    return RagAnswer(
        status="insufficient_authoritative_sources",
        message="В официальных источниках не найдено достаточного подтверждения для точного ответа.",
        required_action="clarify_or_human_review",
    )
