export interface Conversation {
  id: string;
  user_id: string;
  designation_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  designation?: Designation;
  project?: Project;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Designation {
  id: string;
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface CreateConversationRequest {
  designation_id: string;
  project: Project;
  start_date: string;
  end_date: string;
  feedback_document_path: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  message: Message;
  assistant_response?: Message;
}
