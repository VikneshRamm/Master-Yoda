import { useState } from 'react';
import { Header } from '../components/Header';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { ConversationMessages } from '../components/ConversationMessages';
import { NewConversationModal } from '../components/NewConversationModal';
import { Conversation } from '../types/conversation';

export const Conversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [conversationCreated, setConversationCreated] = useState(false);

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowNewConversationModal(false);
    setConversationCreated(!conversationCreated);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-[100vh]">
      <Header />
      <div className="flex flex-1 overflow-hidden h-[calc(100%-70px)]">
        <ConversationSidebar
          onNewConversation={handleNewConversation}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={setSelectedConversation}
          refreshTrigger={conversationCreated}
        />
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <ConversationMessages conversation={selectedConversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Conversation Selected
                </h3>
                <p className="text-gray-600 mb-6">
                  Create a new conversation or select one from the sidebar
                </p>
                <button
                  onClick={handleNewConversation}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
};
