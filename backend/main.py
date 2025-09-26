from __future__ import annotations

import uvicorn


def run() -> None:
    """Run FastAPI app using Uvicorn (development server)."""
    uvicorn.run(
        "api.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        factory=False,
    )


if __name__ == "__main__":
    run()


