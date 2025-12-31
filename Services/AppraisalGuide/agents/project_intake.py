# agents/project_intake.py

from typing import Dict, Any
from state import AppState
from llm import llm
from langchain_core.prompts import PromptTemplate

INTAKE_PROMPT = PromptTemplate(template="""
You are an Intake Agent in a multi-agent performance appraisal system.

Your role is to create a **clear, neutral, and reusable project context summary**
that will be used by downstream agents to evaluate outcomes and impact.
You are NOT performing evaluation or judgment.

The user may be describing internal or sensitive work.
You MUST:
- Avoid asking for proprietary names, internal system identifiers, client names, or confidential metrics
- Phrase all questions at a **high level and in generic terms**
- Focus on *what kind of work* was done, not *where* or *for whom*

---

### Your objective
Gather enough information to produce a structured project context containing:

1. A concise project summary (high-level, non-confidential)
2. The user’s responsibilities and role in the project.
3. Current designation of the user is: *{designation}*. Ask relevant questions to understand user's responsibilities based on their designation.
4. The main technologies or technical areas involved (generic names only)

---

### Interaction rules
- Ask **at most 5 questions total** across the entire conversation
- Ask **only one question per turn**
- If the user’s response already covers missing information, do NOT ask redundant questions
- Prefer clarifying questions only when information is clearly missing
- Stop asking questions as soon as all required information is available

---

### Completion behavior
When you have sufficient information, return **ONLY** the following JSON object, without streaming
(with no additional explanation or text):

{{
  "status": "complete",
  "project_context": {{
    "summary": "A clear, high-level description of the project, suitable for reuse",
    "responsibilities": [
      "Bullet-style list of the user’s responsibilities or contributions"
    ],
    "tech_stack": [
      "Generic technology names or technical domains (e.g., REST APIs, Kubernetes, React)"
    ]
  }}
}}

---

### Question style guidance
- Keep questions short and focused
- Use neutral, non-leading language
- Avoid “why” questions; prefer “what” or “how at a high level”
- Never ask for code, architecture diagrams, internal tool names, or customer details

If the required information cannot be fully obtained within 5 questions,
make reasonable assumptions based on the user’s responses and proceed to completion.
""",
input_variables=["designation"])

async def project_intake_agent(state: AppState, stream_callback):
    try:
        messages = state["messages"]

        print("Project Intake Agent invoked with state:", state)

        designation = state.get("designation", "")                

        INTAKE_PROMPT_FORMATTED = INTAKE_PROMPT.format(
            designation=designation)

        print("Formatted Intake Prompt:")

        # Build full message context
        final_messages = [{"role": "assistant", "content": INTAKE_PROMPT_FORMATTED }]
        final_messages.extend(messages)

        # LLM call with streaming
        # response = await llm.astream(final_messages)

        full_output = ""
        await stream_callback({
            "data": "Yoda is thinking...",
            "type": "status"
        })
        
        async for chunk in llm.astream(final_messages):
            if chunk.content:
                piece = chunk.content
                full_output += piece
                if '"status": "complete"' in full_output:
                    # If complete, skip streaming intermediate pieces
                    continue
                await stream_callback({
                    "data": piece,
                    "type": "message"
                })   # STREAM TO FRONTEND

        

        # Check if intake is complete
        if '"status": "complete"' in full_output:
            return {
                "current_node_complete": True,
                "project_context": extract_json(full_output),
                "messages": messages + [{"role": "assistant", "content": full_output}],
                "wait_for_user_input": False,
                "current_step": "intake"
            }
        else:
            await stream_callback({
                "data": full_output,
                "type": "full_text"
            })  # SIGNAL FINAL TEXT
            await stream_callback({
                "data": "",
                "type": "complete"
            })  # SIGNAL END OF STREAM

        # Intake continues → assistant asked a follow-up question
        return {
            "messages": messages + [{"role": "assistant", "content": full_output}],
            "current_node_complete": False,
            "wait_for_user_input": True,
            "current_step": "intake"
        }
    except Exception as e:
         print("Error in project_intake_agent:", e)
         await stream_callback({
            "data": "Unable to give you response at the moment. Error: " + str(e),
            "type": "message"
         })
         await stream_callback({
            "data": "",
            "type": "complete"
         })  # SIGNAL END OF STREAM
         return {
            "messages": messages + [{"role": "assistant", "content": "Error in processing your request."}],
            "current_node_complete": True,
            "wait_for_user_input": False,
            "error": str(e),
            "current_step": "intake"
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
