import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '../api/conversation';
import { useAuth } from '../contexts/AuthContext';
import { MessageInput } from './MessageInput';
import { Conversation, Message } from '../types/conversation';

interface Props {
  conversation: Conversation;
}

export const ConversationMessages = ({ conversation }: Props) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => conversationApi.getMessages(conversation.id, token!),
    enabled: !!token,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      conversationApi.sendMessage(conversation.id, { content }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['messages', conversation.id],
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
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

        {sendMessageMutation.isPending && (
          <div className="flex justify-end">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ delay: '0.1s' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ delay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {sendMessageMutation.isError && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">
            {sendMessageMutation.error?.message || 'Failed to send message'}
          </p>
        </div>
      )}

      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
      />
    </div>
  );
};
