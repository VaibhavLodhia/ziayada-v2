"""Graph access via Apache AGE — the graph lives *inside* Postgres.

AGE exposes openCypher through Postgres, so every graph query is a SQL
statement of the form:

    SELECT col1::text, col2::text
    FROM cypher('<graph>', $$ <openCypher> $$, $1::agtype) AS (col1 agtype, col2 agtype)

We keep a dedicated asyncpg pool (separate from the SQLAlchemy auth engine)
because every AGE connection must first `LOAD 'age'` and put ag_catalog on the
search_path. Results are cast to text and parsed by `_parse_agtype` — agtype is
a JSON superset, with `::vertex` / `::edge` / `::path` suffixes on graph types.

Cypher porting notes (AGE differs from standard openCypher):
  - `labels(n)` (list) -> `label(n)` (scalar) — AGE vertices have one label.
  - `MERGE ... ON CREATE SET / ON MATCH SET` is unsupported; fold into a single
    `SET x = coalesce(x, <new>)` (the create-case field is null).
  - params are passed as ONE agtype object ($1); reference keys as `$key`.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import asyncpg

from app.config import settings

log = logging.getLogger(__name__)

# app/db/graph.py -> up to services/backend/, then seed/graph/seed.sql
SEED_FILE = Path(__file__).resolve().parents[2] / "seed" / "graph" / "seed.sql"

_pool: asyncpg.Pool | None = None


def _dsn() -> str:
    """asyncpg wants a plain libpq DSN; strip SQLAlchemy's `+asyncpg` driver tag."""
    return settings.database_url.replace("postgresql+asyncpg://", "postgresql://", 1)


async def _init_conn(conn: asyncpg.Connection) -> None:
    """Every AGE connection must load the extension and expose ag_catalog.

    We also register a passthrough text codec for `agtype` so asyncpg can send
    a JSON string as the cypher() params argument (it has no built-in agtype
    support). Results are cast to ::text in SQL, so the decoder is unused.
    """
    await conn.execute("LOAD 'age';")
    await conn.execute('SET search_path = ag_catalog, "$user", public;')
    await conn.set_type_codec(
        "agtype",
        schema="ag_catalog",
        encoder=lambda v: v,
        decoder=lambda v: v,
        format="text",
    )


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        # statement_cache_size=0: AGE's cypher() rewrites the query at parse time
        # and breaks under asyncpg's cached prepared-statement plans (a later
        # cypher() call fails to resolve the overload). Disabling the cache
        # forces a fresh parse per call — the documented AGE + asyncpg fix.
        _pool = await asyncpg.create_pool(
            _dsn(),
            min_size=1,
            max_size=8,
            init=_init_conn,
            statement_cache_size=0,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def _parse_agtype(raw: str | None) -> Any:
    """Parse an agtype text value into Python. agtype is JSON + graph suffixes."""
    if raw is None:
        return None
    # Strip the trailing ::vertex / ::edge / ::path type tag if present.
    for suffix in ("::vertex", "::edge", "::path"):
        if raw.endswith(suffix):
            raw = raw[: -len(suffix)]
            break
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return raw


def _build_sql(query: str, columns: list[str], with_params: bool) -> str:
    """Wrap an openCypher string in the AGE SELECT/cypher() envelope."""
    cols = columns or ["v"]
    select_list = ", ".join(f"{c}::text AS {c}" for c in cols)
    col_defs = ", ".join(f"{c} agtype" for c in cols)
    # Arg typing matters for overload resolution: cast the graph name to `name`
    # and the params to agtype (encoded via the codec in _init_conn); leave the
    # query as the dollar-quoted literal so it coerces to cstring. All-unknown
    # or an explicit ::cstring both fail to resolve cypher()'s overload.
    param_arg = ", $1::ag_catalog.agtype" if with_params else ""
    return (
        f"SELECT {select_list} "
        f"FROM cypher('{settings.age_graph}'::name, $cy${query}$cy${param_arg}) "
        f"AS ({col_defs})"
    )


async def run_cypher(
    query: str,
    columns: list[str] | None = None,
    params: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Run an openCypher query, return rows as dicts keyed by `columns`.

    `columns` are the names in the Cypher RETURN. For write queries with no
    RETURN, omit `columns` (a throwaway column is used and [] is returned).
    `params` is a single dict; reference its keys inside the query as `$key`.
    """
    columns = columns or []
    sql = _build_sql(query, columns, with_params=params is not None)
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Re-assert search_path before every cypher() call. Without it, the
        # SECOND cypher() prepared on a reused connection fails to resolve the
        # function overload — AGE leaves the extended-protocol parse state in a
        # way that a fresh SET clears. Cheap (one round-trip) and reliable.
        await conn.execute('SET search_path = ag_catalog, "$user", public;')
        if params is not None:
            rows = await conn.fetch(sql, json.dumps(params))
        else:
            rows = await conn.fetch(sql)
    if not columns:
        return []
    return [{c: _parse_agtype(r[c]) for c in columns} for r in rows]


async def wait_until_ready(timeout_s: float = 30.0) -> bool:
    """Poll Postgres+AGE until a trivial cypher query succeeds or timeout."""
    import asyncio

    deadline = asyncio.get_event_loop().time() + timeout_s
    while asyncio.get_event_loop().time() < deadline:
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                await conn.execute("SELECT 1;")
            return True
        except Exception as e:  # noqa: BLE001 — broad on purpose during startup poll
            log.debug("AGE/Postgres not ready: %s", e)
            await asyncio.sleep(2)
    return False


async def ensure_graph() -> None:
    """Create the AGE extension and the named graph if they don't exist yet."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS age;")
        await conn.execute('SET search_path = ag_catalog, "$user", public;')
        exists = await conn.fetchval(
            "SELECT count(*) FROM ag_catalog.ag_graph WHERE name = $1",
            settings.age_graph,
        )
        if not exists:
            await conn.execute(
                "SELECT create_graph($1);", settings.age_graph
            )
            log.info("[age] created graph %s", settings.age_graph)


async def ensure_seeded() -> None:
    """Apply seed/graph/seed.sql idempotently (all statements use MERGE)."""
    if not SEED_FILE.exists():
        log.warning("AGE seed file not found: %s", SEED_FILE)
        return
    sql = SEED_FILE.read_text(encoding="utf-8")
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(sql)
    log.info("[age] seed applied")
