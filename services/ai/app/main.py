from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AI-Юрист Казахстан AI Service", version="0.1.0")


class HealthResponse(BaseModel):
    status: str
    service: str
    jurisdiction: str


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="ai", jurisdiction="KZ")
