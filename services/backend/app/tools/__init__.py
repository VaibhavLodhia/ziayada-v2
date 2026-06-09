from langchain_core.tools import BaseTool

from app.tools.graph_lookup import graph_lookup
from app.tools.vector_search import vector_search


def get_default_tools() -> list[BaseTool]:
    return [vector_search, graph_lookup]
