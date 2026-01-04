# workflow.py
import constants
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

# create node for evaluation agent
async def evaluation_node(state, config):
    from agents.evaluation_agent import evaluation_agent
    stream_callback = config['configurable']["stream_callback"]
    return await evaluation_agent(state, stream_callback)

def intake_router(state):
    if state["current_node_complete"]:
        return constants.CONTEXT_BUILDER_STEP
    # If waiting for user input OR not complete, end the workflow
    return END

def context_builder_router(state):
    return constants.EVALUATION_STEP

def start_router(state):
    return state.get("current_step", constants.PROJECT_INTAKE_STEP)

def evaluation_node_router(state):
    if state["current_node_complete"]:
        return END
    if state["wait_for_user_input"]:
        return END
    if not state["current_node_complete"] and not state["wait_for_user_input"]:
        return constants.EVALUATION_STEP
    return END

graph.add_node("start", start_node)
graph.add_node(constants.PROJECT_INTAKE_STEP, intake_node)
graph.add_node(constants.CONTEXT_BUILDER_STEP, context_builder_node)
graph.add_node(constants.EVALUATION_STEP, evaluation_node)
# graph.add_edge("start", "intake")
# graph.add_edge("intake", "context_builder")
# graph.add_edge("context_builder", "evaluation")

# End when intake is complete
graph.add_conditional_edges(
    constants.PROJECT_INTAKE_STEP,
    intake_router
)

graph.add_conditional_edges(
    constants.CONTEXT_BUILDER_STEP,
    context_builder_router
)

graph.add_conditional_edges(
    "start",
    start_router
)

graph.add_conditional_edges(
    constants.EVALUATION_STEP,
    evaluation_node_router
)

graph.set_entry_point("start")

workflow = graph.compile()
