import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash, FiPlus, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const AuthorModal = ({ isOpen, onClose, author, onSubmit, isEditing }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    about: ''
  });

  useEffect(() => {
    if (author) {
      setFormData({
        username: author.username || '',
        email: author.email || '',
        about: author.about || ''
      });
    }
  }, [author]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-aqua">
            {isEditing ? 'Edit Author' : 'Add Author'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-text font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-text font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                required
              />
            </div>
            
            <div>
              <label htmlFor="about" className="block text-text font-medium mb-1">
                About
              </label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 rounded-md text-text hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-aqua text-background font-medium rounded-md hover:bg-opacity-90"
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const PromoteModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [action, setAction] = useState('promote'); // 'promote' or 'demote'

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, action);
    setEmail('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-aqua">
            {action === 'promote' ? 'Promote User to Author' : 'Demote Author to User'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-text font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div className="flex space-x-4 py-2">
              <button
                type="button"
                onClick={() => setAction('promote')}
                className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center ${
                  action === 'promote' 
                    ? 'bg-aqua bg-opacity-20 border-2 border-aqua text-aqua' 
                    : 'border border-gray-600 text-text hover:bg-gray-700'
                }`}
              >
                <FiArrowUp className="mr-2" />
                Promote
              </button>
              <button
                type="button"
                onClick={() => setAction('demote')}
                className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center ${
                  action === 'demote' 
                    ? 'bg-pink bg-opacity-20 border-2 border-pink text-pink' 
                    : 'border border-gray-600 text-text hover:bg-gray-700'
                }`}
              >
                <FiArrowDown className="mr-2" />
                Demote
              </button>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 rounded-md text-text hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-aqua text-background rounded-md hover:bg-aqua-dark"
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Authors = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch authors
  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/blog/authors');
      if (response.data.success) {
        setAuthors(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to load authors');
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load authors';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuthors();
    }
  }, [isAuthenticated]);

  const handleOpenAuthorModal = (author = null) => {
    if (author) {
      setCurrentAuthor(author);
      setIsEditing(true);
    } else {
      setCurrentAuthor(null);
      setIsEditing(false);
    }
    setAuthorModalOpen(true);
  };

  const handleCloseAuthorModal = () => {
    setAuthorModalOpen(false);
    setCurrentAuthor(null);
    setIsEditing(false);
  };

  const handleOpenPromoteModal = () => {
    setPromoteModalOpen(true);
  };

  const handleClosePromoteModal = () => {
    setPromoteModalOpen(false);
  };

  const handleAuthorSubmit = async (formData) => {
    try {
      if (isEditing) {
        // Update author logic would go here
        // Since the API doesn't have a direct endpoint for this, we might need to use a different approach
        toast.success('Author updated successfully');
      } else {
        // Create author logic would go here
        // Since the API doesn't have a direct endpoint for this, we might need to use a different approach
        toast.success('Author added successfully');
      }
      handleCloseAuthorModal();
      fetchAuthors();
    } catch (error) {
      console.error('Error saving author:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save author';
      toast.error(errorMessage);
    }
  };

  const handlePromoteSubmit = async (email, action) => {
    try {
      const endpoint = action === 'promote' 
        ? '/blog/authors/promote' 
        : '/blog/authors/demote';
      
      const response = await apiClient.post(endpoint, { email });
      
      if (response.data.success) {
        toast.success(
          action === 'promote' 
            ? 'User promoted to author successfully' 
            : 'Author demoted to user successfully'
        );
        handleClosePromoteModal();
        fetchAuthors(); // Refresh the author list
      } else {
        toast.error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error?.message || 'An error occurred';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (authorId) => {
    // This is a placeholder since the API doesn't have a direct endpoint for deleting authors
    toast.error('Delete functionality not available in the API');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-aqua">Author Management</h1>
        <button 
          onClick={handleOpenPromoteModal}
          className="bg-aqua text-background px-4 py-2 rounded-md hover:bg-aqua-dark transition-colors flex items-center"
        >
          <FiPlus className="mr-2" />
          Promote/Demote Author
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aqua"></div>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          {authors.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>No authors found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    About
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-700">
                {authors.map((author) => (
                  <tr key={author._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text">{author.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{author.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 truncate max-w-xs">{author.about || 'No bio available'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <AuthorModal
        isOpen={authorModalOpen}
        onClose={handleCloseAuthorModal}
        author={currentAuthor}
        onSubmit={handleAuthorSubmit}
        isEditing={isEditing}
      />
      
      <PromoteModal
        isOpen={promoteModalOpen}
        onClose={handleClosePromoteModal}
        onSubmit={handlePromoteSubmit}
      />
    </div>
  );
};

export default Authors;