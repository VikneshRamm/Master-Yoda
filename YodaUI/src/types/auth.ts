export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user?: {
    id: string;
    username: string;
    designation?: string;
  };
}

export interface User {
  id: string;
  username: string;
  designation?: string;
}
