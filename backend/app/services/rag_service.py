from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.rag_models import TicketEmbedding, DraftResponse
from app.models.models import Ticket, TicketStatus
import uuid
import json
import datetime

model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(txt: str) -> list:
    return model.encode(txt).tolist()

def embed_resolved_tickets(db: Session):
    resolved = db.query(Ticket).filter(
        Ticket.status == TicketStatus.resolved,
        Ticket.resolution != None
    ).all()
    already_embedded = {str(e.ticket_id) for e in db.query(TicketEmbedding).all()}
    new_tickets = [t for t in resolved if str(t.id) not in already_embedded]
    print(f"Embedding {len(new_tickets)} new resolved tickets...")
    for ticket in new_tickets:
        txt = ticket.subject + ' ' + ticket.description
        te = TicketEmbedding(
            ticket_id=ticket.id,
            embedding=get_embedding(txt),
            content=txt,
            category=ticket.category,
            resolution=ticket.resolution,
            is_resolved=True
        )
        db.add(te)
    db.commit()
    return len(new_tickets)

def find_similar_tickets(db: Session, txt: str, limit: int = 5, category: str = None):
    emb = get_embedding(txt)
    emb_str = '[' + ','.join(str(x) for x in emb) + ']'
    cat_filter = ''
    if category:
        safe_cat = category.replace("'", "''")
        cat_filter = f" AND te.category = '{safe_cat}'"
    q = f"""SELECT te.ticket_id, te.content, te.resolution, te.category,
               1 - (te.embedding <=> '{emb_str}'::vector) as similarity
        FROM ticket_embeddings te
        WHERE te.is_resolved = true
        AND te.resolution IS NOT NULL
        {cat_filter}
        ORDER BY te.embedding <=> '{emb_str}'::vector
        LIMIT {limit}"""
    result = db.execute(text(q))
    rows = result.fetchall()
    return [
        {
            "ticket_id": str(row[0]),
            "content": row[1],
            "resolution": row[2],
            "category": row[3],
            "similarity": float(row[4])
        }
        for row in rows
    ]

def build_context(similar_tickets: list) -> str:
    parts = []
    for i, t in enumerate(similar_tickets[:3], 1):
        sim_pct = int(t["similarity"] * 100)
        parts.append(f'Similar ticket {i} (similarity: {sim_pct}%)')
        parts.append('Issue: ' + str(t['content']))
        parts.append('Resolution: ' + str(t['resolution']))
        parts.append('')
    return '\n'.join(parts)

def generate_draft_response(ticket_subject: str, ticket_description: str, similar_tickets: list, category: str = None) -> str:
    context = build_context(similar_tickets)
    cat = category or 'general'
    parts = [
        'You are a helpful customer support agent. Draft a professional response.',
        '',
        'Current ticket:',
        'Subject: ' + ticket_subject,
        'Description: ' + ticket_description,
        'Category: ' + cat,
        '',
        'Similar resolved tickets for context:',
        context,
        'Write a concise professional draft response under 150 words.',
        'Start directly with the response, no preamble.'
    ]
    prompt = '\n'.join(parts)
    try:
        import ollama
        client = ollama.Client(host='http://host.docker.internal:11434')
        response = client.chat(
            model='llama3.2',
            messages=[{'role': 'user', 'content': prompt}]
        )
        return response['message']['content']
    except Exception as e:
        print(f'Ollama error: {e}')
        return 'Thank you for contacting support regarding ' + ticket_subject + '. Our team will review your ' + cat + ' inquiry and respond within 24 hours.'

def save_draft(db: Session, ticket_id: uuid.UUID, draft_text: str, similar_ticket_ids: list):
    existing = db.query(DraftResponse).filter(DraftResponse.ticket_id == ticket_id).first()
    if existing:
        existing.draft_text = draft_text
        existing.similar_ticket_ids = json.dumps(similar_ticket_ids)
        existing.updated_at = datetime.datetime.utcnow()
        db.commit()
        return existing
    draft = DraftResponse(
        ticket_id=ticket_id,
        draft_text=draft_text,
        similar_ticket_ids=json.dumps(similar_ticket_ids)
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft