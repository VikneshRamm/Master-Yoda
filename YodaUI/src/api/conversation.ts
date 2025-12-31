import { API_ENDPOINTS } from './endpoints';
import {
  Conversation,
  Message,
  Designation,
  Project,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/conversation';

const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const conversationApi = {
  getConversations: async (token: string): Promise<Conversation[]> => {
    const response = await fetch(API_ENDPOINTS.conversations.list, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return response.json();
  },

  getConversationById: async (id: string, token: string): Promise<Conversation> => {
    const response = await fetch(API_ENDPOINTS.conversations.getById(id), {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    return response.json();
  },

  createConversation: async (
    data: CreateConversationRequest,
    token: string
  ): Promise<Conversation> => {

    const response = await fetch(API_ENDPOINTS.conversations.create, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    return response.json();
  },

  getMessages: async (conversationId: string, token: string): Promise<Message[]> => {
    // Simulated response
    const response = await fetch(API_ENDPOINTS.conversations.messages(conversationId), {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  sendMessage: async (
    conversationId: string,
    data: SendMessageRequest,
    token: string
  ): Promise<SendMessageResponse> => {
    return {
      message: {
        id: "msg_001",
        conversation_id: conversationId,
        role: "user",
        content: data.content,
        created_at: new Date().toISOString(),
      },
      assistant_response: {
        id: "msg_002",
        conversation_id: conversationId,
        role: "assistant",
        content: "This is a simulated assistant response.",
        created_at: new Date().toISOString(),
      },
    }
    const response = await fetch(API_ENDPOINTS.conversations.sendMessage(conversationId), {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },

  getDesignations: async (token: string): Promise<Designation[]> => {
    const response = await fetch(API_ENDPOINTS.designations.list, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch designations');
    }

   return response.json();
  },

  getProjects: async (token: string): Promise<Project[]> => {
    const response = await fetch(API_ENDPOINTS.projects.list, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  },

  sendMessageStream: async (
    conversationId: string,
    data: SendMessageRequest,
    token: string,
    onEvent: (event: { type: string; data: string }) => void
  ): Promise<void> => {
    
    const response = await fetch(
    API_ENDPOINTS.conversations.sendMessageStream(conversationId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok || !response.body) {
    throw new Error("Failed to start stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      console.log(`Break Hit for value ${value}`);
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // SSE messages end with double newline
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      if (!part.startsWith("data:")) continue;

      const raw = part.replace(/^data:\s*/, "").trim();
      if (!raw) continue;

      try {
        const event = JSON.parse(raw) as { type: string; data: string };
        onEvent(event);

        if (event.type === "complete") {
          reader.cancel();
          return;
        }
      } catch (err) {
        console.error("Failed to parse SSE chunk", raw, err);
      }
    }
  }
  },
};

// const mockStreamResponse = (onEvent: (event: { type: string; data: string }) => void): Promise<void> => {
//   return new Promise((resolve) => {
//     const statuses = [
//       'Analyzing your project work...',
//       'Evaluating against expectations...',
//       'Generating assessment...',
//     ];

//     const responses = [
//       'Based on your project ',
//       'work over this period, I can see ',
//       'you have demonstrated strong ',
//       'technical skills and delivered ',
//       'valuable outcomes. ',
//       'Your attention to detail and ',
//       'collaborative approach have been ',
//       'noteworthy.',
//     ];

//     let statusIndex = 0;
//     let responseIndex = 0;

//     const sendNextStatus = () => {
//       if (statusIndex < statuses.length) {
//         onEvent({ type: 'status', data: statuses[statusIndex] });
//         statusIndex++;
//         setTimeout(sendNextStatus, 800);
//       } else {
//         sendNextResponse();
//       }
//     };

//     const sendNextResponse = () => {
//       if (responseIndex < responses.length) {
//         onEvent({ type: 'response', data: responses[responseIndex] });
//         responseIndex++;
//         setTimeout(sendNextResponse, 200);
//       } else {
//         onEvent({ type: 'complete', data: '' });
//         resolve();
//       }
//     };

//     sendNextStatus();
//   });
// };
