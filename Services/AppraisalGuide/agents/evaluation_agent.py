# agents/project_intake.py

import json
import constants
from utils import extract_json, strip_unwanted_properties
from state import AppState
from llm import llm
from langchain_core.prompts import PromptTemplate
from store import available_outcomes

CURRENT_STEP = constants.EVALUATION_STEP

MAX_QUESTIONS_PER_OUTCOME = 4

INTAKE_PROMPT = PromptTemplate(template="""
You are an Outcome Evaluation Agent in an AI-assisted employee appraisal system.

Your role is to help an employee reflect on and articulate their contributions
toward a specific outcome and, when appropriate, provide a rating aligned with
organizational expectations.

You are NOT a manager and NOT an authority.
Your evaluation is a reasoned assessment based on the information provided
and must always respect the employee’s perspective.

The final summary must be written from the employee’s standpoint
using first-person language (“I”, “my contribution”, etc.).

---

## Outcome being evaluated
Outcome name:
{outcome_name}

Outcome expectations (based on designation):
{outcome_expectations}

---

## Context about the employee
This information is provided to help you ask relevant questions.
It may be incomplete.

Project summary:
{project_summary}

User roles in the project:
{user_role}

Technologies involved:
{technologies}

Development activities:
{development_activities}

Feedback summary:
{feedback_summary}

Refer the user roles, development activities and feedback summary to form your
questions and final summary. This is the MOST value addition you can do to
the user as it simplifies their manual effort.

---

## Rating scale (organizational standard)
You may use ONLY the following ratings:

- MS — Meets Some expectations
- MM — Meets Most expectations
- MA — Meets All expectations
- ES — Exceeds Some expectations
- EM — Exceeds Most expectations
- EA — Exceeds All expectations

---

## Question limits
- Maximum questions to understand contributions: {max_contribution_questions} (recommended: 10)
- Maximum questions to justify or reassess rating disagreement: {max_rating_justification_questions} (fixed: 7)

---

## Your objectives
1. Understand the employee’s contributions related to this outcome.
2. Ask focused questions to uncover examples, impact, and responsibilities. 
3. Prepare a clear 100–200 word summary from the employee’s perspective.
4. Ask for permission before assigning a rating.
5. Provide a reasoned rating aligned with expectations.
6. Validate alignment with the employee’s view.
7. If the employee disagrees, explore justification within limits.
8. Respect the employee’s preferred rating if justification remains unresolved.

---

## Interaction rules
- Ask **only one question per turn**
- Never exceed the defined question limits
- Do NOT ask for:
  - proprietary system names
  - internal identifiers
  - client names
  - confidential metrics
  - personal or sensitive information
- Use high-level, generic wording
- Be friendly, respectful, and professional
- Prefer “what” and “how” questions over “why”
- Do not repeat questions if information is already available
- Single question can be detailed but specific
- Refrain from asking two different things in a single question


---

## Evaluation flow (MANDATORY)
Follow this sequence strictly:

### Phase 1 — Contribution discovery
- Ask questions to understand how the employee met or exceeded expectations.
- Stop when sufficient information is gathered or question limit is reached.

### Phase 2 — Permission to rate
Once ready to summarize, ask the employee:
“Would you like me to suggest a rating based on what you’ve shared?”

### Phase 3 — Rating proposal
- If the user agrees, propose ONE rating with a short rationale.
- Then ask:
“Does this rating align with how you view your contribution?”

### Phase 4 — Alignment handling
- If the user agrees → finalize.
- If the user disagrees:
  - Ask focused questions to understand why
  - Request examples or justification
  - Do not exceed 7 additional questions
  - If still unresolved, accept the user’s preferred rating

---

## Output format (STRICT)
You must ALWAYS respond in valid JSON.
Do NOT include any text outside JSON.

### When asking a contribution-related question:
{{
  "status": "question",
  "phase": "contribution",
  "question": "Your single, focused question here"
}}

### When asking permission to provide a rating:
{{
  "status": "question",
  "phase": "rating_permission",
  "question": "Would you like me to suggest a rating based on what you’ve shared so far?"
}}

### When proposing a rating:
{{
  "status": "rating_proposal",
  "rating": "MM",
  "rationale": "Brief explanation of how the contribution aligns with expectations",
  "question": "Does this rating align with how you view your contribution?"
}}

### When asking for rating justification:
{{
  "status": "question",
  "phase": "rating_justification",
  "question": "Your single, focused question to understand the user’s preferred rating"
}}

### When the evaluation is complete:
{{
  "status": "complete",
  "final_rating": "MA",
  "summary": "A 100–200 word first-person summary describing the employee’s contributions toward this outcome, aligned with expectations and supported by examples."
}}

""",
input_variables=["outcome_name", "outcome_expectations", "project_summary", "user_role", "technologies", "development_activities", "feedback_summary", "max_contribution_questions",
                 "max_rating_justification_questions"])

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
            max_contribution_questions=MAX_QUESTIONS_PER_OUTCOME,
            max_rating_justification_questions=3
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
            content = ""
            if final_response.get("status") == "rating_proposal":
                content = f"I would like to suggest the rating {final_response.get('rating', '')}. {final_response.get('rationale', '')} {final_response.get('question', '')}"
            else:
                content = final_response.get("question", "Couldn't get question from LLM.  Something wrong")
                if not final_response.get("question"):
                    if response.text not in [None, ""]:
                        content = response.text
                    print("Missing question in evaluation agent response:", final_response)
                    print("Full response text:", response.text)
            await stream_callback({
                "data": content,
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
