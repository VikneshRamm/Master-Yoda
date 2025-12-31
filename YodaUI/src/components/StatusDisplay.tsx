import { Loader } from 'lucide-react';

interface Props {
  status: string;
  isActive: boolean;
}

export const StatusDisplay = ({ status, isActive }: Props) => {
  if (!isActive || !status) return null;

  return (
    <div className="px-4 py-3 bg-blue-50 border-l-4 border-blue-600 flex items-center gap-3">
      <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
      <p className="text-sm text-blue-700">{status}</p>
    </div>
  );
};
