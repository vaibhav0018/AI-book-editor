"""
FastAPI application entrypoint.

Uvicorn loads this module to serve the API. The app factory in ``app.py``
will be wired to routers in later Phase 1 steps.
"""

from app import create_app

app = create_app()
