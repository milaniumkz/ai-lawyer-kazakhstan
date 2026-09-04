import unittest

try:
    from fastapi.testclient import TestClient

    from main import app
except Exception:  # pragma: no cover - documents missing optional runtime deps locally
    TestClient = None
    app = None


@unittest.skipIf(TestClient is None or app is None, "FastAPI TestClient is not installed")
class AiHttpSmokeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_endpoint(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["jurisdiction"], "KZ")

    def test_classifier_ocr_and_rag_endpoints(self) -> None:
        classification = self.client.post("/classify", json={"text": "Нужны алименты на ребенка"})
        ocr = self.client.post("/ocr", json={"file_name": "договор.pdf"})
        rag = self.client.post("/rag/safe-answer", json={"has_confirmed_source": False})

        self.assertEqual(classification.status_code, 200)
        self.assertEqual(classification.json()["subcategory"], "alimony")
        self.assertEqual(ocr.status_code, 200)
        self.assertEqual(ocr.json()["status"], "review_required")
        self.assertEqual(rag.status_code, 200)
        self.assertEqual(rag.json()["status"], "insufficient_authoritative_sources")


if __name__ == "__main__":
    unittest.main()
