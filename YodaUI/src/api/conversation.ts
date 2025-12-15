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

    return {
      id: "conv_001",
      user_id: "user_123",
      designation_id: "desig_456",
      project_id: "proj_789",
      start_date: "2025-01-01T09:00:00Z",
      end_date: "2025-01-31T18:00:00Z",
      created_at: "2025-01-01T09:00:00Z",
      updated_at: "2025-01-15T12:30:00Z",
      designation: {
        id: "desig_456",
        name: "Senior Developer",
        description: "Responsible for backend architecture and code reviews"
      },
      project: {
        id: "proj_789",
        name: "AI Chatbot Platform",
        description: "Building a scalable real-time chatbot using ASP.NET and React"
      }
    };

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
    return [
      {
        id: "msg_001",
        conversation_id: conversationId,
        role: "user",
        content: "Hello, I need help with my project.",
        created_at: new Date().toISOString(),
      },
      {
        id: "msg_002",
        conversation_id: conversationId,
        role: "assistant",
        content: "Sure, I'd be happy to assist you. What seems to be the issue?",
        created_at: new Date().toISOString(),
      }
    ];
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

    return [
      {
        id: '1',
        name: 'Project Engineer',
        description: 'Responsible for developing software applications.',
      },
      {
        id: '2',
        name: 'Senior Project Engineer',
        description: 'Oversees product development and strategy.',
      },
      {
        id: '3',
        name: 'Project Lead',
        description: 'Leads the engineering team and manages projects.',
      }
    ]
  },

  getProjects: async (token: string): Promise<Project[]> => {
    const response = await fetch(API_ENDPOINTS.projects.list, {
      method: 'GET',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return [
      {
        id: '1',
        name: 'Project Alpha',
        description: 'A cutting-edge platform for data analytics.',
      },
      {
        id: '2',
        name: 'Project Beta',
        description: 'An innovative mobile application for social networking.',
      }
    ]
  },
};
