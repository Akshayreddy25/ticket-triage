import pandas as pd
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline
import joblib
import os

print("Loading Bitext dataset...")
ds = load_dataset("bitext/bitext-customer-support-llm-chatbot-training-dataset")
df = ds['train'].to_pandas()
print(f"Loaded {len(df)} examples")

category_map = {
    "cancel_order": "refund",
    "change_order": "refund",
    "check_refund_policy": "refund",
    "track_refund": "refund",
    "place_order": "refund",
    "check_invoice": "billing",
    "check_payment_methods": "billing",
    "payment_issue": "billing",
    "get_invoice": "billing",
    "registration_problems": "account_access",
    "change_username": "account_access",
    "recover_password": "account_access",
    "edit_account": "account_access",
    "switch_account": "account_access",
    "delivery_period": "delivery",
    "track_order": "delivery",
    "delivery_options": "delivery",
    "set_up_shipping_address": "delivery",
    "contact_human_agent": "general",
    "complaint": "general",
    "review": "general",
    "newsletter_subscription": "general",
    "contact_customer_service": "general",
    "technical_support": "technical",
    "website_feedback": "technical",
    "get_refund": "refund",
    "check_cancellation_fee": "refund",
}

df['category'] = df['intent'].map(category_map)
df = df.dropna(subset=['category'])
print(f"After mapping: {len(df)} examples")
print(df['category'].value_counts())

def label_urgency(text):
    text_lower = text.lower()
    high_signals = [
        "urgent", "asap", "immediately", "emergency",
        "hacked", "fraud", "unauthorized", "stolen",
        "charged multiple times", "locked out",
        "cannot access", "completely broken",
        "account compromised"
    ]
    medium_signals = [
        "please", "need help", "issue", "problem",
        "not working", "error", "failed", "wrong"
    ]
    if any(s in text_lower for s in high_signals):
        return "high"
    elif any(s in text_lower for s in medium_signals):
        return "medium"
    return "low"

df['urgency'] = df["instruction"].apply(label_urgency)
print("\nUrgency distribution:")
print(df['urgency'].value_counts())

print("\nTraining category classifier...")
X = df["instruction"]
y_cat = df['category']

X_train, X_test, y_train, y_test = train_test_split(
    X, y_cat, test_size=0.2, random_state=42, stratify=y_cat
)

category_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=15000,
        ngram_range=(1, 2),
        sublinear_tf=True
    )),
    ('clf', LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        C=1.0
    ))
])

category_pipeline.fit(X_train, y_train)
y_pred = category_pipeline.predict(X_test)
print("\nCategory Classification Report:")
print(classification_report(y_test, y_pred))

print("Training urgency classifier...")
y_urg = df['urgency']

X_train_u, X_test_u, y_train_u, y_test_u = train_test_split(
    X, y_urg, test_size=0.2, random_state=42, stratify=y_urg
)

urgency_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        sublinear_tf=True
    )),
    ('clf', LogisticRegression(
        max_iter=1000,
        class_weight='balanced'
    ))
])

urgency_pipeline.fit(X_train_u, y_train_u)
y_pred_u = urgency_pipeline.predict(X_test_u)
print("\nUrgency Classification Report:")
print(classification_report(y_test_u, y_pred_u))

os.makedirs("backend/app/ml/models", exist_ok=True)
joblib.dump(category_pipeline, "backend/app/ml/models/category_classifier.joblib")
joblib.dump(urgency_pipeline, "backend/app/ml/models/urgency_classifier.joblib")
print("\nModels saved to backend/app/ml/models/")
