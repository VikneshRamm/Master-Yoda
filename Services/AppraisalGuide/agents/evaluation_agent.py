# agents/project_intake.py

import json
import constants
from utils import extract_json, strip_unwanted_properties
from state import AppState
from llm import llm
from langchain_core.prompts import PromptTemplate
from store import available_outcomes

CURRENT_STEP = constants.EVALUATION_STEP

MAX_QUESTIONS_PER_OUTCOME = 5

INTAKE_PROMPT = PromptTemplate(template="""
You are an Outcome Evaluation Agent in an AI-assisted employee appraisal system.

Your role is to help an employee reflect on and articulate their contributions
toward a specific outcome in a clear, structured, and justified manner.
You are assisting the employee in preparing a strong self-written appraisal summary.

The final summary must be written from the employee’s perspective
using first-person language (e.g., “I”, “my contribution”, “I worked on…”).

---

## Outcome being evaluated
Outcome name:
{outcome_name}

Outcome expectations (based on designation):
{outcome_expectations}
                               
You need to use this information to guide your questions and final summary.

---

## Context about the employee (reference only)
The following information is provided to help you ask relevant questions.
This information may be incomplete.

Project summary:
{project_summary}

User roles in the project:
{user_role}

Technologies involved:
{technologies}

Development activities (from time logs or work records):
{development_activities}

Feedback summary (aggregated over time):
{feedback_summary}

Maximum number of questions allowed:
{max_questions}

---

## Your objectives
1. Understand how the employee’s work aligns with the outcome expectations.
2. Encourage the employee to recall concrete examples, responsibilities, or impact.
3. Ask only relevant questions that help justify the outcome.
4. Stop asking questions once sufficient information is available
   or once the maximum number of questions is reached.
5. Produce a concise, high-quality summary (100–200 words).

---

## Interaction rules
- Ask **only one question per turn**
- Ask **at most {max_questions} questions total**
- Do NOT ask for:
  - proprietary system names
  - internal identifiers
  - client names
  - confidential metrics
  - personal or sensitive information
- Phrase questions in **high-level, generic terms**
- Be friendly and professional, but not overly casual
- Do not repeat questions if the information is already provided
- Prefer “what” and “how” questions over “why”
- If the question limit is reached, make reasonable assumptions and proceed

---

## Completion criteria
Stop asking questions and produce the final summary when:
- The employee’s contributions relative to the outcome are clear, OR
- The question limit has been reached

---

## Output format (STRICT)
You must ALWAYS respond in valid JSON.
Do NOT include any text outside JSON.

### When asking the next question:
{{
  "status": "question",
  "question": "Your next single, focused question here"
}}

### When the outcome evaluation is complete:
{{
  "status": "complete",
  "summary": "A 100–200 word first-person summary describing the employee’s contributions toward this outcome, clearly aligned with expectations and supported by examples."
}}

""",
input_variables=["outcome_name", "outcome_expectations", "project_summary", "user_role", "technologies", "development_activities", "feedback_summary", "max_questions"])

async def evaluation_agent(state: AppState, stream_callback):
    try:
        messages = state["messages"]

        # print("Evaluation Agent invoked with state:", state)
        designation = state.get("designation", "")

        outcomes = available_outcomes[designation]
        completed_outcomes = state.get("completed_outcomes", [])

        context_builder_data = state.get("context_builder_data", {})

        # get the outcomes that are not yet completed
        pending_outcomes = [o for o in outcomes if o["outcome"] not in completed_outcomes]
        evaluating_outcome = pending_outcomes[0] if pending_outcomes else None

        present_step = CURRENT_STEP + " " + evaluating_outcome["outcome"] if evaluating_outcome else ""

        await stream_callback({
            "type": "state_update",
            "data": json.dumps({"outcome_under_evaluation": evaluating_outcome["outcome"] if evaluating_outcome else ""}),
            "current_step": present_step
        })

        await stream_callback({
            "type": "state_update",
            "data": json.dumps({"current_step": constants.EVALUATION_STEP}),
            "current_step": present_step
        })

        INTAKE_PROMPT_FORMATTED = INTAKE_PROMPT.format(
            designation=designation,
            outcome_name=evaluating_outcome["outcome"] if evaluating_outcome else "",
            outcome_expectations=evaluating_outcome["expectation"] if evaluating_outcome else "",
            project_summary=context_builder_data.get("project_summary", ""),
            user_role=context_builder_data.get("user_role", ""),
            technologies=context_builder_data.get("technologies", ""),
            development_activities=context_builder_data.get("development_activities", ""),
            feedback_summary=context_builder_data.get("feedback_summary", ""),
            max_questions=MAX_QUESTIONS_PER_OUTCOME
            )
        
        current_step_messages = [m for m in messages if m.get("message_section", "") == present_step]
        current_step_messages = strip_unwanted_properties(current_step_messages)
        if current_step_messages == []:
            current_step_messages = [{"role": "user", "content": "Start evaluation for outcome " + evaluating_outcome["outcome"]}]

        # Build full message context
        final_messages = [{"role": "assistant", "content": INTAKE_PROMPT_FORMATTED }]
        final_messages.extend(current_step_messages)
        
        await stream_callback({
            "data": f"Yoda is thinking to evaluate{evaluating_outcome['outcome']}...",
            "type": "status",
            "current_step": present_step
        })

        response = await llm.ainvoke(final_messages)

        if response.text:
            final_response = extract_json(response.text)
        else:
            final_response = {"error": "No response text from LLM"}
        
        if final_response.get("error"):
            raise Exception(final_response["error"])

        if final_response.get("status") == "complete":
            await stream_callback({
                "data": final_response.get("summary", "Couldn't get summary"),
                "type": "full_text",
                "current_step": present_step
            })
            await stream_callback({
                "data": json.dumps({"completed_outcomes": completed_outcomes + [evaluating_outcome["outcome"]]}),
                "type": "full_text",
                "current_step": present_step
            })
            return {
                "completed_outcomes": completed_outcomes + [evaluating_outcome["outcome"]],
                "current_node_complete": False,
                "wait_for_user_input": False,
                "current_step": present_step
            }
        else:
            await stream_callback({
                "data": final_response.get("question", "Couldn't get question"),
                "type": "full_text",
                "current_step": present_step
            })
              # SIGNAL FINAL TEXT
            await stream_callback({
                "data": "",
                "type": "complete",
                "current_step": present_step
            })  # SIGNAL END OF STREAM
            return {
                "current_node_complete": False,
                "wait_for_user_input": True,
                "current_step": present_step
            }
    except Exception as e:
         print("Error in project_intake_agent:", e)
         await stream_callback({
            "data": "Unable to give you response at the moment. Error: " + str(e),
            "type": "full_text",
            "current_step": present_step
         })
         await stream_callback({
            "data": "",
            "type": "complete",
            "current_step": present_step
         })  # SIGNAL END OF STREAM
         return {
            "current_node_complete": True,
            "wait_for_user_input": False,
            "error": str(e),
            "current_step": present_step
        }
