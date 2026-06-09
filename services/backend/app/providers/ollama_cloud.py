from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.config import settings


def build_chat_llm() -> BaseChatModel:
    """Ollama Cloud exposes an OpenAI-compatible endpoint at /v1.

    We use ChatOpenAI pointed at it so we get robust OpenAI tool-calling
    semantics with no Ollama-specific quirks.
    """
    return ChatOpenAI(
        base_url=settings.ollama_base_url,
        api_key=settings.ollama_api_key,
        model=settings.ollama_chat_model,
        temperature=0.2,
    )
