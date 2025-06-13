import logging
import inspect
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db import get_db
from routers import studies, responses, logs, redcap, users, nlp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
)

app = FastAPI(title="Study Designer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# @app.on_event("startup")
# async def on_startup():
#     await init_db()

@app.get("/health")
async def health(db=Depends(get_db)):
    """
    Ping MongoDB. If db.client.admin.command(...) returns a coroutine,
    await it; if it returns a plain dict (PyMongo), just use it.
    """
    try:
        ping_result = db.client.admin.command("ping")
        if inspect.isawaitable(ping_result):
            await ping_result
    except Exception:
        raise HTTPException(status_code=503, detail="MongoDB unreachable")
    return {"status": "ok", "mongo": "reachable"}

prefix = '/api/v2'
app.include_router(studies.router, prefix=prefix, tags=["studies"])
app.include_router(responses.router, prefix=prefix, tags=["responses"])
app.include_router(redcap.router, prefix=prefix, tags=["redcap"])
app.include_router(users.router, prefix=prefix, tags=["users"])
app.include_router(nlp.router, prefix=prefix, tags=["nlp"])
