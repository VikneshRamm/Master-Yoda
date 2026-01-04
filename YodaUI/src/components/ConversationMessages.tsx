import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
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
  message_section?: string;
  message_type?: string;
}

interface MessageGroup {
  section: string;
  normalMessages: Message[];
  metadataMessages: Message[];
}

export const ConversationMessages = ({ conversation }: Props) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedMetadata, setExpandedMetadata] = useState<Set<string>>(new Set());

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => conversationApi.getMessages(conversation.id, token!),
    enabled: !!token,
  });

  const groupMessagesBySection = (msgs: Message[]): MessageGroup[] => {
    const groupMap = new Map<string, MessageGroup>();

    msgs.forEach((message) => {
      const section = message.message_section || 'General';
      if (!groupMap.has(section)) {
        groupMap.set(section, {
          section,
          normalMessages: [],
          metadataMessages: [],
        });
      }

      const group = groupMap.get(section)!;
      if (message.message_type === 'metadata') {
        group.metadataMessages.push(message);
      } else {
        group.normalMessages.push(message);
      }
    });

    return Array.from(groupMap.values());
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleMetadata = (section: string) => {
    const newExpanded = new Set(expandedMetadata);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedMetadata(newExpanded);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    const groups = groupMessagesBySection(messages);
    if (expandedSections.size === 0 && groups.length > 0) {
      setExpandedSections(new Set(groups.map((g) => g.section)));
    }
  }, []);

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
      message_section: messages[messages.length - 1]?.message_section || 'General',
      message_type: '',
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

  const renderMessage = (msg: Message) => (
    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-md px-4 py-3 rounded-lg ${
          msg.role === 'user'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        <p className="text-sm">{msg.content}</p>
        <p
          className={`text-xs mt-2 ${
            msg.role === 'user' ? 'text-green-100' : 'text-gray-500'
          }`}
        >
          {new Date(msg.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );

  const renderMetadataMessage = (msg: Message) => (
    <div key={msg.id} className="flex justify-start">
      <div className="max-w-md px-4 py-3 rounded-lg bg-gray-100 text-gray-900 border border-gray-300 italic">
        <p className="text-xs">{msg.content}</p>
        <p className="text-xs mt-2 text-gray-500">
          {new Date(msg.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );

  const groups = groupMessagesBySection(messages);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !streamingMessage ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              Start the conversation by typing a message
            </p>
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.section} className="space-y-3">
                <button
                  onClick={() => toggleSection(group.section)}
                  className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedSections.has(group.section) ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  {group.section}
                </button>

                {expandedSections.has(group.section) && (
                  <div className="space-y-3 ml-6">
                    {group.normalMessages.map((msg) => renderMessage(msg))}

                    {group.metadataMessages.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <button
                          onClick={() => toggleMetadata(group.section)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-600 transition-colors"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedMetadata.has(group.section) ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                          Metadata ({group.metadataMessages.length})
                        </button>

                        {expandedMetadata.has(group.section) && (
                          <div className="space-y-2 mt-3 ml-4">
                            {group.metadataMessages.map((msg) => renderMetadataMessage(msg))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
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
