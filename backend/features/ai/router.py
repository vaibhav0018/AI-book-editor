"""FastAPI routes for AI actions — thin handlers that delegate to the AI service."""

import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from features.ai import service
from features.ai.models import AIAction
from features.ai.agents.planner_agent import OutlineParseError
from features.ai.schemas import (
    OutlineRequest,
    OutlineResponse,
    OutlineChapter,
    GenerateChapterRequest,
    EditorActionRequest,
    EditorActionResponse,
    SummarizeRequest,
    SummarizeResponse,
    AIActionRecord,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/outline", response_model=OutlineResponse)
async def generate_outline(payload: OutlineRequest, db: Session = Depends(get_db)):
    """Generate a chapter outline for a book and persist the chapters."""
    chapters, model_used = await service.generate_outline(db, payload.book_id)
    return OutlineResponse(
        chapters=[OutlineChapter(title=c["title"], brief=c["brief"]) for c in chapters],
        model_used=model_used,
    )


@router.post("/generate-chapter")
async def generate_chapter(payload: GenerateChapterRequest, db: Session = Depends(get_db)):
    """Stream chapter generation via Server-Sent Events."""
    generator, model_used, context = await service.generate_chapter_stream(
        db, payload.book_id, payload.chapter_id,
    )

    async def event_stream():
        full_text = []
        try:
            async for chunk in generator:
                full_text.append(chunk)
                yield f"data: {json.dumps({'token': chunk})}\n\n"

            # Persist, summarize, and update memory BEFORE "done" so clients that
            # refetch on `done` see chapter.summary and book.global_summary.
            content = "".join(full_text)
            if content:
                await service.finalize_chapter_generation(
                    db, payload.book_id, payload.chapter_id,
                    content, model_used, context,
                )
            yield f"data: {json.dumps({'done': True, 'model_used': model_used})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/rewrite", response_model=EditorActionResponse)
async def rewrite_text(payload: EditorActionRequest, db: Session = Depends(get_db)):
    """Rewrite, improve, continue, summarize, or change tone on selected text."""
    result, model_used = await service.run_editor_action(
        db,
        chapter_id=payload.chapter_id,
        action=payload.action,
        selected_text=payload.selected_text,
        tone=payload.tone,
        custom_instruction=payload.custom_instruction,
    )
    return EditorActionResponse(result=result, model_used=model_used)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_chapter(payload: SummarizeRequest, db: Session = Depends(get_db)):
    """Explicitly summarize a chapter's content."""
    try:
        summary, model_used = await service.summarize_chapter(db, payload.chapter_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    return SummarizeResponse(summary=summary, model_used=model_used)


# ── History ──────────────────────────────────────────────────

history_router = APIRouter(tags=["ai"])


@history_router.get(
    "/api/chapters/{chapter_id}/history",
    response_model=List[AIActionRecord],
)
async def get_chapter_ai_history(chapter_id: str, db: Session = Depends(get_db)):
    """Return AI action audit trail for a chapter."""
    records = (
        db.query(AIAction)
        .filter(AIAction.chapter_id == chapter_id)
        .order_by(AIAction.created_at.desc())
        .all()
    )
    return records
