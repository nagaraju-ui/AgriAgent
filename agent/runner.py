"""Entry points used by API, UI and eval.

- chat(): conversational, LLM-driven (intent + grounded reasoning). Used by the chat UI.
- run_agent(): the structured LangGraph pipeline. Used by the REST API and eval.
"""
from agent.state import AgentState  # noqa


def chat(message, history=None, location=None, lang="en"):
    """Conversational entry. history is a list of (role, text) tuples."""
    from agent.brain import respond
    return respond(message, history or [], location, lang)


def run_agent(query, location=None, lang="en", state_name=None):
    state = {"query": query, "location": location, "lang": lang, "state_name": state_name}
    try:
        from agent.graph import build_agent
        return build_agent().invoke(state)
    except Exception:
        from agent.nodes import planner, tool_executor, synthesis
        while True:
            state = planner(state)
            if state.get("next_action") == "synthesize":
                return synthesis(state)
            state = tool_executor(state)
