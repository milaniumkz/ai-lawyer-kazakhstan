from dataclasses import dataclass


@dataclass(frozen=True)
class OcrRequest:
    file_name: str
    language_hint: str = "ru"


@dataclass(frozen=True)
class OcrResponse:
    status: str
    extracted_fields: dict[str, str]
    low_confidence_fields: list[str]
    warning: str


def ocr_stub(request: OcrRequest) -> OcrResponse:
    return OcrResponse(
        status="review_required",
        extracted_fields={"documentTitle": request.file_name, "language": request.language_hint},
        low_confidence_fields=["documentTitle"],
        warning="OCR stub. Пользователь должен подтвердить извлеченные поля.",
    )
