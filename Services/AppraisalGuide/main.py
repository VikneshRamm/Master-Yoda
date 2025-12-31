# main.py

import base64
import datetime
import os
from pathlib import Path
from typing import List
from uuid import uuid4

import requests
import session_store
from models import Conversation, CreateConversationRequest, Project, StreamingResponseChunk
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from store import available_designations
import asyncio
import json
from fastapi.middleware.cors import CORSMiddleware

from workflow import workflow
from state import INITIAL_STATE

load_dotenv()

from settings import settings



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory session (can be replaced with Redis)
# SESSION = {}

# print(os.getenv("GOOGLE_API_KEY"))


@app.post("/api/conversations/{conversation_id}/messages/stream")
async def chat_stream(conversation_id: str, message: dict):

    user_message = message["content"]

    # Initialize session if not exists
    current_session = session_store.load_session(conversation_id)

    current_session["messages"].append({
        "id": str(uuid4()),
        "role": "user",
        "content": user_message,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "conversation_id": conversation_id
    })

    session_store.save_session(conversation_id, current_session)

    async def event_generator():
        queue = asyncio.Queue()

        async def stream_callback(chunk: StreamingResponseChunk):
            await queue.put(chunk)

        # Invoke workflow
        task = asyncio.create_task(
            workflow.ainvoke(
                current_session,
                config={"stream_callback": stream_callback}
            )
        )

        while True:
            token: StreamingResponseChunk = await queue.get()
            print("Yielding token:", token)
            # if token contains FINAL_TEXT, split the string with FINAL_TEXT and store the second part in SESSION
            if token['type'] == "full_text":
                current_session["messages"].append({
                    "role": "assistant",
                    "content": token['data'],
                    "id": str(uuid4()),
                    "created_at": datetime.datetime.utcnow().isoformat(),
                    "conversation_id": conversation_id
                })
                continue
            if token['type'] == "complete":
                yield f"data: {json.dumps(token)}\n\n"
                break
            yield f"data: {json.dumps(token)}\n\n"
        
        session_store.save_session(conversation_id, current_session)
        state = await task
        # queue.put({
        #     "data": "",
        #     "type": "complete"
        # })

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/conversations", response_model=Conversation)
def create_conversation(request: CreateConversationRequest):
    now = datetime.datetime.utcnow().isoformat()

    designation = next((d for d in available_designations if d.id == request.designation_id), None)
    file_path = Path(request.feedback_document_path)
    print("Feedback document path:", file_path)

    conversation = Conversation(
        id=str(uuid4()),
        user_id="mock-user-id",  # replace with auth-derived user id later
        designation_id=request.designation_id,        
        project_id=request.project.id,
        start_date=request.start_date,
        end_date=request.end_date,
        created_at=now,
        updated_at=now,
        designation=designation,
        project=request.project,
        feedback_document_path=base64.b64encode(str(file_path).encode('utf-8')).decode('utf-8'),
        clockify_user_id="6698b68c78057435d7c7a0d2"
    )

    current_session = INITIAL_STATE.copy()
    current_session["conversation"] = conversation.dict()
    current_session["designation"] = designation.name if designation else ""
    session_store.save_session(conversation.id, current_session)

    return conversation

# api to get all available projects
@app.get("/api/projects", response_model=List[Project])
def get_projects():
    # Access variables via dot notation
    url = f"https://api.clockify.me/api/v1/workspaces/{settings.clockify_workspace_id}/projects"
    headers = {
        "X-Api-Key": settings.clockify_api_key,
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return [Project(id=p['id'], name=p['name']) for p in response.json()]
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Clockify Error: {str(e)}")

# api to get all available designations
@app.get("/api/designations")
def get_designations():
    return available_designations

# api to get conversations by session id
@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: str):
    session = session_store.load_session(conversation_id)
    conversation = Conversation(**session["conversation"])
    return conversation

#api to get messages within a conversation
@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str):
    session = session_store.load_session(conversation_id)
    return session["messages"]

#api to get all conversations
@app.get("/api/conversations", response_model=list[Conversation])
def get_all_conversations():
    conversations = []
    all_sessions = session_store.get_all_session_states()
    for session_id, state in all_sessions.items():
        if "conversation" in state:
            conversations.append(Conversation(**state["conversation"]))
    #sort conversations by created_at date descending
    conversations.sort(key=lambda x: x.created_at, reverse=True)
    return conversations
