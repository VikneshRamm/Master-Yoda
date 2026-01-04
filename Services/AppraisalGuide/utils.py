from typing import Any, Dict, List


def strip_unwanted_properties(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cleaned_messages = []
    for message in messages:
        cleaned_message = {
            "role": message["role"],
            "content": message["content"],
            "created_at": message["created_at"]
        }
        cleaned_messages.append(cleaned_message)
    return cleaned_messages

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
