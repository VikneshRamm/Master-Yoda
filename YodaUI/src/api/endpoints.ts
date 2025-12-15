const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/login`,
  },
  conversations: {
    list: `${API_BASE_URL}/conversations`,
    create: `${API_BASE_URL}/conversations`,
    getById: (id: string) => `${API_BASE_URL}/conversations/${id}`,
    messages: (id: string) => `${API_BASE_URL}/conversations/${id}/messages`,
    sendMessage: (id: string) => `${API_BASE_URL}/conversations/${id}/messages`,
  },
  designations: {
    list: `${API_BASE_URL}/designations`,
  },
  projects: {
    list: `${API_BASE_URL}/projects`,
  },
} as const;
