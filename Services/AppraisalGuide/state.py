# state.py
from typing import TypedDict, List, Dict, Any

class AppState(TypedDict):
    messages: List[Dict[str, Any]]
    project_context: Dict[str, Any]
    current_node_complete: bool
    wait_for_user_input: bool
    conversation: Dict[str, Any]
    current_step: str
    designation: str
    error: str
    clockify_data: Dict[str, Any]
    feedback_document_path: str
    completed_outcomes: List[str]
    outcome_under_evaluation: str
    context_builder_data: Dict[str, Any]

INITIAL_STATE: AppState = {
    "messages": [],
    "project_context": {},
    "current_node_complete": False,
    "wait_for_user_input": False,
    "conversation": {},
    "current_step": "",
    "designation": "",
    "error": "",
    "completed_outcomes": [],
    "clockify_data": {},
    "feedback_document_path": "",
    "outcome_under_evaluation": "",
    "context_builder_data": {}
}
