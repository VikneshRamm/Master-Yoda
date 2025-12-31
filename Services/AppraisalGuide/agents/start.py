from state import AppState

async def start(state: AppState, stream_callback):
    await stream_callback({
        "type": "status",
        "data": "Starting to process..."
    })
    cs = state.get("current_step")
    next_step = cs if (cs and cs != "start") else "intake"
    return {
        "current_node_complete": True,
        "current_step": next_step,
    }
