import unittest

from classifier import ClassificationRequest, classify_text


class AiClassifierTest(unittest.TestCase):
    def test_classifies_alimony(self) -> None:
        result = classify_text(ClassificationRequest(text="Нужны алименты на ребенка"))

        self.assertEqual(result.category, "family")
        self.assertEqual(result.subcategory, "alimony")

    def test_escalates_unknown(self) -> None:
        result = classify_text(ClassificationRequest(text="Непонятная ситуация"))

        self.assertEqual(result.complexity, "human_review_required")
        self.assertEqual(result.escalation_reason, "low_confidence")


if __name__ == "__main__":
    unittest.main()
