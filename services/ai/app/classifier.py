from dataclasses import dataclass


@dataclass(frozen=True)
class ClassificationRequest:
    text: str
    language: str = "ru"


@dataclass(frozen=True)
class ClassificationResponse:
    category: str
    subcategory: str
    complexity: str
    risk: str
    confidence: float
    escalation_reason: str | None = None


def classify_text(request: ClassificationRequest) -> ClassificationResponse:
    text = request.text.lower()
    if "алимент" in text:
        return ClassificationResponse(category="family", subcategory="alimony", complexity="medium", risk="medium", confidence=0.86)
    if "долг" in text or "задолж" in text:
        return ClassificationResponse(category="civil_contract", subcategory="debt_collection", complexity="medium", risk="medium", confidence=0.82)
    if "суд" in text or "подпис" in text:
        return ClassificationResponse(
            category="procedural",
            subcategory="court_submission",
            complexity="complex",
            risk="high",
            confidence=0.7,
            escalation_reason="submission_or_signature_intent",
        )
    return ClassificationResponse(
        category="clarification_required",
        subcategory="unknown",
        complexity="human_review_required",
        risk="unknown",
        confidence=0.48,
        escalation_reason="low_confidence",
    )
