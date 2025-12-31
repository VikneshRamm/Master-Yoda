import { API_ENDPOINTS } from './endpoints';
import { LoginRequest, LoginResponse } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return {
      access_token: 'mocked_access_token',
      user: {
        id: '1',
        username: credentials.username,
        designation: 'Mocked User',
      },
    }
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },
};
