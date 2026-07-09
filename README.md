# Ticket Triage — AI Customer Support Platform

A full-stack AI platform that automatically classifies, routes, and resolves customer support tickets using NLP and machine learning.

## Demo Credentials
- Agent: agent@tickettriage.com / agent123
- Admin: admin@tickettriage.com / admin123

## What It Does

1. Classifies tickets into 6 categories (billing, refund, technical, account access, delivery, general)
2. Detects urgency level with a confidence score
3. Routes automatically if confidence >= 85%, suggests at 60-85%, escalates below 60%
4. Flags critical keywords (hacked, fraud, unauthorized) to manual review
5. Stores AI predictions for evaluation and retraining
6. Lets agents correct wrong predictions via feedback loop

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Backend | Python 3.11, FastAPI |
| Database | PostgreSQL 15 |
| ML Classifier | TF-IDF + Logistic Regression (scikit-learn 1.6) |
| Authentication | JWT + bcrypt |
| Infrastructure | Docker, Docker Compose |
| Dataset | Bitext (23,907 examples) + Kaggle CS Tickets (8,469 rows) |

## ML Performance

| Metric | Score |
|---|---|
| Category F1 (test set) | 1.00 |
| Urgency F1 (test set) | 0.99 |
| Real-world confidence range | 36-91% |
| Training examples | 23,907 |
| Categories | 6 |

Near-perfect F1 reflects clean Bitext training data. Real-world tickets show more variance (36-91%), which is why the three-tier routing system exists.

## Routing Logic

- Confidence >= 85% — Automatic assignment
- Confidence 60-85% — Suggested assignment (agent confirms)
- Confidence < 60% — Manual review queue
- Critical keywords — Always manual review (hacked, fraud, unauthorized, stolen)

## Features

- AI Classification with TF-IDF bigrams and sublinear TF scaling
- Confidence-aware three-tier routing with configurable thresholds
- 8,825+ real tickets seeded from Kaggle customer support dataset
- Human feedback loop — agents correct predictions stored for retraining
- Evaluation dashboard — routing accuracy, category distribution, model performance
- JWT authentication with four roles: customer, agent, team lead, admin
- Burst injection endpoint — inject N classified tickets instantly for demos
- Auto-refresh dashboard every 30 seconds

## Getting Started

### Prerequisites
- Docker Desktop
- Git

### Run locally

```bash
git clone https://github.com/Akshayreddy25/ticket-triage
cd ticket-triage
docker-compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Inject test tickets

```bash
curl -X POST "http://localhost:8000/api/v1/simulate/burst?count=10"
```

## Architecture

```
Customer submits ticket
        |
        v
FastAPI validates request via Pydantic
        |
        v
TF-IDF Vectorizer converts text to weighted word vectors
        |
        v
Logistic Regression predicts category and urgency with probabilities
        |
        v
Routing Engine
  confidence >= 0.85   -> automatic assignment
  confidence 0.60-0.85 -> suggested assignment
  confidence < 0.60    -> manual review
  critical keyword     -> manual review (security escalation)
        |
        v
PostgreSQL stores ticket and prediction separately
        |
        v
React Dashboard shows real-time results with confidence bars
        |
        v
Agent reviews and submits feedback stored for retraining
```

## Database Schema

| Table | Purpose |
|---|---|
| users | Customers, agents, team leads, admins |
| tickets | Every support request |
| predictions | ML model output per ticket |
| feedback | Agent corrections to model predictions |
| evaluations | Accuracy metrics tracked over time |

## Project Structure

```
ticket-triage/
├── backend/
│   ├── app/
│   │   ├── api/        # Route handlers (tickets, auth, feedback, dashboard, simulate)
│   │   ├── core/       # Config, security, JWT deps
│   │   ├── db/         # SQLAlchemy session
│   │   ├── models/     # Database models (5 tables)
│   │   ├── ml/         # Classifier, training script, seed script, simulator
│   │   ├── schemas/    # Pydantic request and response models
│   │   └── services/   # Business logic
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/      # Login, Dashboard, TicketList, TicketDetail, Evaluation
│       └── services/   # API client, auth utilities
└── docker-compose.yml
```