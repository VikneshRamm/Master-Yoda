import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-[70px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Master Yoda
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 hidden sm:block">
                {user?.username || 'User'}
              </span>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
