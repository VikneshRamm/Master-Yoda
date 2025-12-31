# workflow.py

from langgraph.graph import StateGraph, END
from state import AppState


graph = StateGraph(AppState)

async def intake_node(state, config):
    # print("In intake_node with state:", state)
    # print("In intake_node with config:", config)
    from agents.project_intake import project_intake_agent
    stream_callback = config['configurable']["stream_callback"]
    return await project_intake_agent(state, stream_callback)

async def context_builder_node(state, config):
    from agents.context_builder import context_builder
    stream_callback = config['configurable']["stream_callback"]
    return await context_builder(state, stream_callback)

async def start_node(state, config):
    from agents.start import start
    stream_callback = config['configurable']["stream_callback"]
    return await start(state, stream_callback)

def intake_router(state):
    if state["current_node_complete"]:
        return "context_builder"
    # If waiting for user input OR not complete, end the workflow
    return END

def context_builder_router(state):
    return END

def start_router(state):
    return state.get("current_step", "intake")

graph.add_node("start", start_node)
graph.add_node("intake", intake_node)
graph.add_node("context_builder", context_builder_node)

graph.add_edge("start", "intake")
graph.add_edge("intake", "context_builder")

# End when intake is complete
graph.add_conditional_edges(
    "intake",
    intake_router
)

graph.add_conditional_edges(
    "context_builder",
    context_builder_router
)

graph.add_conditional_edges(
    "start",
    start_router
)

graph.set_entry_point("start")

workflow = graph.compile()
