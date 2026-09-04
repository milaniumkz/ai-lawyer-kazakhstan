import unittest

from classifier import ClassificationRequest, classify_text
from ocr import OcrRequest, ocr_stub


class AiClassifierTest(unittest.TestCase):
    def test_classifies_alimony(self) -> None:
        result = classify_text(ClassificationRequest(text="Нужны алименты на ребенка"))

        self.assertEqual(result.category, "family")
        self.assertEqual(result.subcategory, "alimony")

    def test_escalates_unknown(self) -> None:
        result = classify_text(ClassificationRequest(text="Непонятная ситуация"))

        self.assertEqual(result.complexity, "human_review_required")
        self.assertEqual(result.escalation_reason, "low_confidence")

    def test_ocr_requires_review(self) -> None:
        result = ocr_stub(OcrRequest(file_name="договор.pdf"))

        self.assertEqual(result.status, "review_required")
        self.assertIn("documentTitle", result.low_confidence_fields)


if __name__ == "__main__":
    unittest.main()
