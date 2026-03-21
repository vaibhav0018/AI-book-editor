"""Application factory: FastAPI instance, middleware, and router registration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from middleware.error_handler import ErrorHandlerMiddleware
from features.book.router import router as book_router
from features.chapter.router import router as chapter_router
from features.ai.router import router as ai_router, history_router

# Import all models so SQLAlchemy resolves cross-module relationships
import features.book.models  # noqa: F401
import features.chapter.models  # noqa: F401
import features.ai.models  # noqa: F401


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    application = FastAPI(
        title="AI Book Editor API",
        description="Backend for the AI-powered long-form book writing editor.",
        version="0.1.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(ErrorHandlerMiddleware)

    # Routers
    application.include_router(book_router)
    application.include_router(chapter_router)
    application.include_router(ai_router)
    application.include_router(history_router)

    return application
