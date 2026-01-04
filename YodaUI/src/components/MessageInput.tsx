import { useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface Props {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const MessageInput = ({ onSendMessage, isLoading }: Props) => {
  const [message, setMessage] = useState('');
  const { transcript, isListening, isSupported, error, startListening, stopListening, resetTranscript } = useVoiceInput();

  const displayText = message || transcript;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayText.trim()) {
      onSendMessage(displayText);
      setMessage('');
      resetTranscript();
    }
  };

  const handleVoiceStart = () => {
    if (!isListening) {
      startListening();
    }
  };

  const handleVoiceStop = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        setMessage(transcript);
      }
    }
  };

  const handleVoiceClick = () => {
    if (isListening) {
      handleVoiceStop();
    } else {
      handleVoiceStart();
    }
  };

  const handleClearVoice = () => {
    resetTranscript();
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white">
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {isListening && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
          <span className="text-xs text-blue-700 font-medium">Listening...</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex gap-3">
          {/* <input
            type="text"
            value={displayText}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading || isListening}
            placeholder="Type your message or use voice..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50"
          /> */}
          <textarea
            value={displayText}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading || isListening}
            placeholder="Type your message or use voice..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none disabled:bg-gray-50 resize-none"
            rows={2}
            style={{ minHeight: '48px', maxHeight: '160px', overflow: 'auto', whiteSpace: 'pre-wrap' }}
          />

          {isSupported && (
            <button
              type="button"
              onClick={handleVoiceClick}
              disabled={isLoading}
              className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                isListening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="hidden sm:inline">{isListening ? 'Stop' : 'Voice'}</span>
            </button>
          )}

          <button
            type="submit"
            disabled={!displayText.trim() || isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        {transcript && !message && (
          <button
            type="button"
            onClick={handleClearVoice}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear voice input
          </button>
        )}
      </div>
    </form>
  );
};
