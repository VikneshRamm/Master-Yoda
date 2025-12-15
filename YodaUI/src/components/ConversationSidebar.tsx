import { useQuery } from '@tanstack/react-query';
import { Plus, MessageSquare } from 'lucide-react';
import { conversationApi } from '../api/conversation';
import { useAuth } from '../contexts/AuthContext';
import { Conversation } from '../types/conversation';

interface Props {
  onNewConversation: () => void;
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  refreshTrigger: boolean;
}

export const ConversationSidebar = ({
  onNewConversation,
  selectedConversationId,
  onSelectConversation,
  refreshTrigger,
}: Props) => {
  const { token } = useAuth();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', refreshTrigger],
    queryFn: () => conversationApi.getConversations(token!),
    enabled: !!token,
  });

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>New Conversation</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors border-l-4 ${
                  selectedConversationId === conversation.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {conversation.project?.name || 'Project'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.designation?.name || 'Designation'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
