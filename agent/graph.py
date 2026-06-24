"""LangGraph wiring: planner -> tools -> (loop) -> synthesis -> END."""
from langgraph.graph import StateGraph, END
from agent.state import AgentState
from agent.nodes import planner, tool_executor, synthesis


def _route(state):
    return "synthesis" if state.get("next_action") == "synthesize" else "tools"


def build_agent():
    g = StateGraph(AgentState)
    g.add_node("planner", planner)
    g.add_node("tools", tool_executor)
    g.add_node("synthesis", synthesis)
    g.set_entry_point("planner")
    g.add_conditional_edges("planner", _route, {"tools": "tools", "synthesis": "synthesis"})
    g.add_edge("tools", "planner")        # conditional edge: loop until enough info
    g.add_edge("synthesis", END)
    return g.compile()
