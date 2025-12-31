import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';
import styles from './Home.module.css';

export const Home = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleStartAppraisal = () => {
    navigate('/conversations');
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${styles.main}`}>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <MessageSquare className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Master Yoda
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your conversational appraisal assistant. Start a new conversation to get
              evaluated on your work performance.
            </p>

            <button
              onClick={handleStartAppraisal}
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium mb-6 shadow-md hover:shadow-lg"
            >
              Start Appraisal
            </button>

            <button
              onClick={logout}
              className="ml-4 px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
