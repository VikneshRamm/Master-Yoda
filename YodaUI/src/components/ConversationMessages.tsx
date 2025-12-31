import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '../api/conversation';
import { useAuth } from '../contexts/AuthContext';
import { MessageInput } from './MessageInput';
import { StatusDisplay } from './StatusDisplay';
import { Conversation, Message } from '../types/conversation';

interface Props {
  conversation: Conversation;
}

interface StreamingMessage {
  id: string;
  content: string;
  role: 'assistant';
  created_at: string;
}

export const ConversationMessages = ({ conversation }: Props) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => conversationApi.getMessages(conversation.id, token!),
    enabled: !!token,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSendMessage = async (message: string) => {
    setIsStreaming(true);
    setStreamError(null);
    setCurrentStatus('');
    setStreamingMessage({
      id: `temp-${Date.now()}`,
      content: '',
      role: 'assistant',
      created_at: new Date().toISOString(),
    });

    messages.push({
      id: `temp-user-${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    });

    try {
      await conversationApi.sendMessageStream(
        conversation.id,
        { content: message },
        token!,
        (event) => {
          if (event.type === 'status') {
            setCurrentStatus(event.data);
          } else if (event.type === 'response') {
            setCurrentStatus('');
            setStreamingMessage((prev) =>
              prev
                ? {
                    ...prev,
                    content: prev.content + event.data,
                  }
                : null
            );
          } else if (event.type === 'complete') {
            setStreamingMessage(null);
            setCurrentStatus('');
            setIsStreaming(false);
            queryClient.invalidateQueries({
              queryKey: ['messages', conversation.id],
            });
          }
        }
      );
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : 'Failed to send message');
      setIsStreaming(false);
      setStreamingMessage(null);
      setCurrentStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !streamingMessage ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              Start the conversation by typing a message
            </p>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-md px-4 py-3 rounded-lg bg-white text-gray-900 border border-gray-200">
              <p className="text-sm">{streamingMessage.content}</p>
              {streamingMessage.content && (
                <p className="text-xs mt-2 text-gray-400">streaming...</p>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <StatusDisplay status={currentStatus} isActive={isStreaming} />

      {streamError && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">{streamError}</p>
        </div>
      )}

      <MessageInput onSendMessage={handleSendMessage} isLoading={isStreaming} />
    </div>
  );
};
