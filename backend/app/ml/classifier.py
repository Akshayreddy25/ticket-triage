import joblib
import os
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

TEAM_ROUTING = {
    "billing": "payments-support",
    "refund": "payments-support",
    "account_access": "account-support",
    "technical": "technical-support",
    "delivery": "delivery-support",
    "general": "general-support"
}

AUTO_THRESHOLD = 0.85
SUGGEST_THRESHOLD = 0.60

class TicketClassifier:
    def __init__(self):
        self.category_model = None
        self.urgency_model = None
        self._load_models()

    def _load_models(self):
        cat_path = os.path.join(MODEL_DIR, "category_classifier.joblib")
        urg_path = os.path.join(MODEL_DIR, "urgency_classifier.joblib")
        if os.path.exists(cat_path):
            self.category_model = joblib.load(cat_path)
            print("Category model loaded")
        else:
            print(f"Category model not found at {cat_path}")
        if os.path.exists(urg_path):
            self.urgency_model = joblib.load(urg_path)
            print("Urgency model loaded")
        else:
            print(f"Urgency model not found at {urg_path}")

    def predict(self, text):
        if not self.category_model or not self.urgency_model:
            return self._fallback_prediction()
        cat_proba = self.category_model.predict_proba([text])[0]
        cat_idx = np.argmax(cat_proba)
        category = self.category_model.classes_[cat_idx]
        category_confidence = float(cat_proba[cat_idx])
        urg_proba = self.urgency_model.predict_proba([text])[0]
        urg_idx = np.argmax(urg_proba)
        urgency = self.urgency_model.classes_[urg_idx]
        urgency_confidence = float(urg_proba[urg_idx])
        recommended_team = TEAM_ROUTING.get(category, "general-support")
        if category_confidence >= AUTO_THRESHOLD:
            routing_mode = "automatic"
        elif category_confidence >= SUGGEST_THRESHOLD:
            routing_mode = "suggested"
        else:
            routing_mode = "manual"
        critical_keywords = ["hacked", "fraud", "unauthorized", "stolen", "account compromised", "emergency"]
        if any(kw in text.lower() for kw in critical_keywords):
            urgency = "high"
            routing_mode = "manual"
        return {
            "predicted_category": category,
            "category_confidence": round(category_confidence, 4),
            "predicted_urgency": urgency,
            "urgency_confidence": round(urgency_confidence, 4),
            "recommended_team": recommended_team,
            "routing_mode": routing_mode
        }

    def _fallback_prediction(self):
        return {
            "predicted_category": "general",
            "category_confidence": 0.0,
            "predicted_urgency": "medium",
            "urgency_confidence": 0.0,
            "recommended_team": "general-support",
            "routing_mode": "manual"
        }

    def is_ready(self):
        return self.category_model is not None and self.urgency_model is not None

classifier = TicketClassifier()
