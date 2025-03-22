import { Link, useLocation } from 'react-router-dom';
import { 
  FiX, FiHome, FiUsers, FiFolder, FiFileText
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user has admin role
  const isAdmin = user?.role === 'admin';

  return (
    <div className={`bg-card fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } md:relative md:translate-x-0`}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700">
        <Link to="/dashboard" className="text-2xl font-bold text-aqua">
          Blog Admin
        </Link>
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-text hover:text-aqua"
        >
          <FiX size={24} />
        </button>
      </div>
      
      <nav className="mt-5 px-4">
        <div className="space-y-2">
          {/* Dashboard */}
          <Link 
            to="/dashboard" 
            className={`flex items-center px-4 py-3 rounded-md transition-colors ${
              location.pathname === '/dashboard' 
                ? 'bg-aqua bg-opacity-10 text-aqua' 
                : 'text-text hover:bg-gray-800'
            }`}
          >
            <FiHome className="mr-3" size={18} />
            <span>Dashboard</span>
          </Link>
          
          {/* Authors Section - Only visible to admins */}
          {isAdmin && (
            <Link 
              to="/authors" 
              className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                location.pathname.startsWith('/authors') 
                  ? 'bg-aqua bg-opacity-10 text-aqua' 
                  : 'text-text hover:bg-gray-800'
              }`}
            >
              <FiUsers className="mr-3" size={18} />
              <span>Authors</span>
            </Link>
          )}
          
          {/* Categories Section */}
          <Link 
            to="/categories" 
            className={`flex items-center px-4 py-3 rounded-md transition-colors ${
              location.pathname.startsWith('/categories') 
                ? 'bg-aqua bg-opacity-10 text-aqua' 
                : 'text-text hover:bg-gray-800'
            }`}
          >
            <FiFolder className="mr-3" size={18} />
            <span>Categories</span>
          </Link>
          
          {/* Blogs Section */}
          <Link 
            to="/blogs" 
            className={`flex items-center px-4 py-3 rounded-md transition-colors ${
              location.pathname.startsWith('/blogs') 
                ? 'bg-aqua bg-opacity-10 text-aqua' 
                : 'text-text hover:bg-gray-800'
            }`}
          >
            <FiFileText className="mr-3" size={18} />
            <span>Blogs</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar; 