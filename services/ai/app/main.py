from fastapi import FastAPI
from pydantic import BaseModel

from classifier import ClassificationRequest as ClassifierRequest
from classifier import classify_text
from ocr import OcrRequest as StubOcrRequest
from ocr import ocr_stub
from rag import safe_answer

app = FastAPI(title="AI-Юрист Казахстан AI Service", version="0.1.0")


class HealthResponse(BaseModel):
    status: str
    service: str
    jurisdiction: str


class ClassificationRequest(BaseModel):
    text: str
    language: str = "ru"


class ClassificationResponse(BaseModel):
    category: str
    subcategory: str
    complexity: str
    risk: str
    confidence: float
    escalation_reason: str | None = None


class OcrRequest(BaseModel):
    file_name: str
    language_hint: str = "ru"


class OcrResponse(BaseModel):
    status: str
    extracted_fields: dict[str, str]
    low_confidence_fields: list[str]
    warning: str


class RagRequest(BaseModel):
    has_confirmed_source: bool = False
    query: str = ""
    source_text: str = ""
    source_url: str = ""


class RagResponse(BaseModel):
    status: str
    message: str
    required_action: str | None = None
    provider: str | None = None
    model_id: str | None = None


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="ai", jurisdiction="KZ")


@app.post("/classify", response_model=ClassificationResponse)
def classify(request: ClassificationRequest) -> ClassificationResponse:
    result = classify_text(ClassifierRequest(text=request.text, language=request.language))
    return ClassificationResponse(**result.__dict__)


@app.post("/ocr", response_model=OcrResponse)
def ocr(request: OcrRequest) -> OcrResponse:
    result = ocr_stub(StubOcrRequest(file_name=request.file_name, language_hint=request.language_hint))
    return OcrResponse(**result.__dict__)


@app.post("/rag/safe-answer", response_model=RagResponse)
def rag_safe_answer(request: RagRequest) -> RagResponse:
    result = safe_answer(
        request.has_confirmed_source,
        query=request.query,
        source_text=request.source_text,
        source_url=request.source_url,
    )
    return RagResponse(**result.__dict__)
