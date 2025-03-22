import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiMenu } from 'react-icons/fi';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-card shadow-md z-10">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="text-text hover:text-aqua md:hidden"
          >
            <FiMenu size={24} />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right mr-4">
            <p className="text-text">{user?.username || 'User'}</p>
            <p className="text-sm text-gray-400">{user?.role || 'Admin'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="border border-aqua text-aqua hover:bg-aqua hover:bg-opacity-10 font-semibold py-2 px-4 rounded-md transition-all"
          >
            <FiLogOut className="inline mr-2" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 