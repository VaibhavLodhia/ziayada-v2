import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin_users, auth_routes, chat, chat_stream, graph, health, me, voice
from app.auth_core.bootstrap import bootstrap_admin
from app.config import settings
from app.db.graph import close_pool, ensure_graph, ensure_seeded, wait_until_ready
from app.db.postgres import dispose_engine, init_db

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Postgres first — auth depends on it. Then admin bootstrap, then the AGE
    # graph (which lives inside the same Postgres).
    try:
        await init_db()
        await bootstrap_admin()
    except Exception as e:
        log.exception("Postgres init/bootstrap failed: %s", e)

    if await wait_until_ready(timeout_s=15.0):
        try:
            await ensure_graph()
            await ensure_seeded()
        except Exception as e:
            log.exception("AGE graph init/seed failed: %s", e)
    else:
        log.warning("Postgres/AGE not reachable on startup; graph features will fail until it is.")
    yield
    await close_pool()
    await dispose_engine()


app = FastAPI(title="Ziyada API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth_routes.router)
app.include_router(admin_users.router)
app.include_router(me.router)
app.include_router(chat.router)
app.include_router(chat_stream.router)
app.include_router(graph.router)
app.include_router(voice.router)
