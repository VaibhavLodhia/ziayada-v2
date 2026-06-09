from langchain_core.tools import tool

_STUB_DOCS = [
    {
        "content": "Ziyada is a zero-trust intelligence layer above foundation models.",
        "source": "docs/overview.md",
        "score": 0.92,
    },
    {
        "content": "OWASP LLM Top-10 scans run nightly via the garak harness.",
        "source": "docs/security/owasp.md",
        "score": 0.81,
    },
    {
        "content": "Backend exposes a FastAPI gateway in front of provider-agnostic LLM calls.",
        "source": "docs/architecture/backend.md",
        "score": 0.77,
    },
]


@tool
async def vector_search(query: str, k: int = 3) -> list[dict]:
    """Search the internal document corpus by semantic similarity.

    Returns up to k chunks shaped like pgvector rows: content, source, score.
    """
    return _STUB_DOCS[: max(1, min(k, len(_STUB_DOCS)))]
