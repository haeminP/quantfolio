from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import learners, indicators

app = FastAPI(
    title="Quantfolio API",
    description="ML4T Portfolio Analytics Engine",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learners.router, prefix="/api/learners", tags=["learners"])
app.include_router(indicators.router, prefix="/api/indicators", tags=["indicators"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
