import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { conversationApi } from '../api/conversation';
import { useAuth } from '../contexts/AuthContext';
import { Conversation } from '../types/conversation';

interface Props {
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export const NewConversationModal = ({ onClose, onConversationCreated }: Props) => {
  const { token } = useAuth();
  const [designationId, setDesignationId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: designations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: () => conversationApi.getDesignations(token!),
    enabled: !!token,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => conversationApi.getProjects(token!),
    enabled: !!token,
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) =>
      conversationApi.createConversation(
        {
          designation_id: designationId,
          project_id: projectId,
          start_date: startDate,
          end_date: endDate,
        },
        token!
      ),
    onSuccess: (conversation) => {
      onConversationCreated(conversation);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (designationId && projectId && startDate && endDate) {
      createConversationMutation.mutate(null);
    }
  };

  const isFormValid = designationId && projectId && startDate && endDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Start New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Designation
            </label>
            <select
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
            >
              <option value="">Select designation</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          {createConversationMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {createConversationMutation.error?.message || 'Failed to create conversation'}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || createConversationMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createConversationMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
