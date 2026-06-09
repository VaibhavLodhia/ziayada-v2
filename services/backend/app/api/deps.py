from functools import lru_cache

from app.agent.graph import build_agent
from app.providers.ollama_cloud import build_chat_llm
from app.tools import get_default_tools


@lru_cache(maxsize=1)
def get_agent():
    llm = build_chat_llm()
    tools = get_default_tools()
    return build_agent(llm, tools)
