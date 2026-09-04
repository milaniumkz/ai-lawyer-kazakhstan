from fastapi import FastAPI
from pydantic import BaseModel

from classifier import ClassificationRequest as ClassifierRequest
from classifier import classify_text

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


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="ai", jurisdiction="KZ")


@app.post("/classify", response_model=ClassificationResponse)
def classify(request: ClassificationRequest) -> ClassificationResponse:
    result = classify_text(ClassifierRequest(text=request.text, language=request.language))
    return ClassificationResponse(**result.__dict__)
