import json
from typing import Any, Dict
from state import AppState
from llm import llm
from langchain_core.tools import tool
from tools.clockify_tools import get_all_descriptions
from tools.feedback_doc_reader import parse_feedback_excel


@tool
def get_clockify_work_descriptions(project_id: str, user_id: str, rangeStart: str, rangeEnd: str) -> str:
    """
    Retrieve all work descriptions from Clockify time tracking for a specific project and user within a date range.
    Returns a comma-separated string of work descriptions. Filter and return only items that involve actual 
    development work (coding, testing, bug fixes, implementation, etc.). Exclude meetings, discussions, 
    standup calls, and non-technical activities.
    
    Args:
        project_id: The Clockify project ID
        user_id: The Clockify user ID
        rangeStart: Start date in ISO 8601 format (e.g., "2025-06-13T00:00:00.000Z")
        rangeEnd: End date in ISO 8601 format (e.g., "2025-10-24T23:59:59.000Z")
    
    Returns:
        Comma-separated string of unique work descriptions
    """
    return get_all_descriptions(project_id, user_id, rangeStart, rangeEnd)


@tool
def get_feedback_summary(file_path: str) -> str:
    """
    Parse and return the employee feedback document content as JSON.
    The feedback document contains appreciations, areas of improvement, and action items.
    Summarize the key feedback points in a concise manner (aim for 200 words or less).
    
    Args:
        file_path: Base64 encoded path to the feedback Excel document
    
    Returns:
        JSON string containing structured feedback data from all sheets
    """
    return parse_feedback_excel(file_path)


async def context_builder(state: AppState, stream_callback) -> Dict[str, Any]:
    """
    Build the project context from the current state using LLM with tool calling.
    This agent gathers context about the user's work by:
    1. Fetching and filtering development work from Clockify time logs
    2. Summarizing feedback received by the user
    """
    await stream_callback({"type": "status", "data": "Building project context..."})
    
    # Prepare tools for the LLM
    tools = [get_clockify_work_descriptions, get_feedback_summary]
    llm_with_tools = llm.bind_tools(tools)
    
    # Build the prompt for the LLM
    system_prompt = """You are a context building agent that helps gather information about an employee's work activities and feedback.

Your task is to:
1. Use the get_clockify_work_descriptions tool to retrieve time log entries and identify ONLY actual development work activities (coding, testing, bug fixes, feature implementation, code reviews, deployment, etc.). Completely ignore and exclude: meetings, discussions, standups, planning sessions, and any non-technical activities.

2. Use the get_feedback_summary tool to read the feedback document and provide a concise summary of the key points in approximately 200 words. Focus on the most important appreciations, areas for improvement, and action items.

3. The final response should contain **ONLY** the following JSON object, without any additional explanation or text:
{{
    "development_activities": ["list of filtered development work items"],
    "feedback_summary": "A 200-word summary of the feedback document",
    "project_summary": "project summary from context",
    "user_role": "user responsibilities",
    "technologies": ["tech stack used"],
    "designation": "user designation"
}}

Be thorough in filtering out non-development activities from Clockify logs."""
    
    # Extract parameters from state
    conversation = state.get("conversation", {})
    project_id = conversation.get("project_id", "")
    user_id = conversation.get("clockify_user_id", "")
    rangeStart = conversation.get("start_date", "")
    rangeEnd = conversation.get("end_date", "")
    feedback_path = conversation.get("feedback_document_path", "")
    
    # Get existing project context
    project_context = state.get("project_context", {}).get("project_context", {})
    project_summary = project_context.get("summary", "")
    user_role = project_context.get("responsibilities", [])
    technologies = project_context.get("tech_stack", [])
    designation = state.get("designation", "")
    
    # Build the user message with all required information
    user_message = f"""Please gather and analyze the following information:

1. Retrieve Clockify work descriptions using these parameters:
   - project_id: {project_id}
   - user_id: {user_id}
   - rangeStart: {rangeStart}
   - rangeEnd: {rangeEnd}

2. Retrieve and summarize the feedback document from:
   - file_path: {feedback_path}

3. Include the following existing context in your final JSON response:
   - project_summary: {project_summary}
   - user_role: {user_role}
   - technologies: {technologies}
   - designation: {designation}

Remember to filter only actual development work from Clockify and provide a concise 200-word feedback summary."""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    await stream_callback({"type": "status", "data": "Calling LLM with tools..."})
    
    # Invoke the LLM with tools
    response = await llm_with_tools.ainvoke(messages)

    try:

    
    # Handle tool calls if any
        while response.tool_calls:
            await stream_callback({"type": "status", "data": f"Executing tools: {len(response.tool_calls)} tool(s)..."})
            
            messages.append(response)
            
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                
                await stream_callback({"type": "status", "data": f"Calling {tool_name}..."})
                
                if tool_name == "get_clockify_work_descriptions":
                    tool_result = get_all_descriptions(**tool_args)
                elif tool_name == "get_feedback_summary":
                    tool_result = parse_feedback_excel(**tool_args)
                else:
                    tool_result = f"Unknown tool: {tool_name}"
                
                messages.append({
                    "role": "tool",
                    "content": tool_result,
                    "tool_call_id": tool_call["id"]
                })
            
            # Get next response from LLM
            response = await llm_with_tools.ainvoke(messages)
        
        await stream_callback({"type": "status", "data": "Processing LLM response..."})
        
        # Extract the final response
        if response.text:
            final_response = json.dumps(extract_json(response.text), indent=4)
        else:
            final_response = "{{\"error\": \"No response text from LLM\"}}"
        
        await stream_callback({"type": "status", "data": "Project context built successfully."})
        
        # Stream the final response
        await stream_callback({
            "data": final_response,
            "type": "full_text"
        })
        
        await stream_callback({
            "data": "",
            "type": "complete"
        })
        
        return {
            "messages": state["messages"] + [{"role": "assistant", "content": final_response}],
            "current_node_complete": True,
            "current_step": "context_builder",
        }
    except Exception as e:
        await stream_callback({"type": "status", "data": f"Error occurred: {str(e)}"})
        return {
            "messages": state["messages"],
            "current_node_complete": False,
            "error": str(e),
            "current_step": "context_builder",
        }


def extract_json(text: str) -> Dict[str, Any]:
    """
    Extract the JSON substring from the LLM output.
    Simplified extraction for prototype.
    """
    import json
    import re
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return json.loads(match.group(0))
    return {}
