"""Global exception handler — returns consistent JSON error responses."""

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Catch unhandled exceptions; preserve HTTPException for 404/422/etc."""

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except HTTPException:
            raise  # Let FastAPI handle structured errors (404, 422, etc.)
        except Exception as exc:
            return JSONResponse(
                status_code=500,
                content={"detail": str(exc)},
            )
