# session_store.py
import json
from redis_client import redis_client
from state import INITIAL_STATE
from typing import Dict, Any

SESSION_PREFIX = "session:"

def load_session(session_id: str) -> dict:
    key = SESSION_PREFIX + session_id
    raw = redis_client.get(key)

    if raw is None:
        return INITIAL_STATE.copy()

    return json.loads(raw)


def save_session(session_id: str, state: dict):
    key = SESSION_PREFIX + session_id
    redis_client.set(key, json.dumps(state))


def get_all_session_states() -> Dict[str, Any]:
    """
    Fetch all session states from Redis whose keys start with SESSION_PREFIX.
    Returns:
        {
          "<session_id>": <session_state_dict>,
          ...
        }
    """
    sessions: Dict[str, Any] = {}
    cursor = 0

    while True:
        cursor, keys = redis_client.scan(
            cursor=cursor,
            match=f"{SESSION_PREFIX}*",
            count=100
        )

        for key in keys:
            raw_value = redis_client.get(key)
            if raw_value is None:
                continue

            try:
                session_state = json.loads(raw_value)
            except json.JSONDecodeError:
                # Skip corrupted or non-JSON values
                continue

            session_id = key.replace(SESSION_PREFIX, "", 1)
            sessions[session_id] = session_state

        if cursor == 0:
            break

    return sessions
