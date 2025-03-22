import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash, FiPlus, FiX } from 'react-icons/fi';

const CategoryModal = ({ isOpen, onClose, category, onSubmit, isEditing }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
    } else {
      setName('');
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-aqua">
            {isEditing ? 'Edit Category' : 'Add Category'}
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
              <label htmlFor="name" className="block text-text font-medium mb-1">
                Category Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                placeholder="Technology"
                required
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
                className="px-4 py-2 bg-aqua text-background rounded-md hover:bg-aqua-dark"
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Categories = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/blog/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to load categories';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  const handleOpenModal = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setIsEditing(true);
    } else {
      setCurrentCategory(null);
      setIsEditing(false);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentCategory(null);
  };

  const handleSubmit = async (formData) => {
    try {
      if (isEditing) {
        // Update existing category
        const response = await apiClient.put(`/blog/categories/${currentCategory._id}`, formData);
        if (response.data.success) {
          toast.success('Category updated successfully');
          handleCloseModal();
          fetchCategories();
        } else {
          toast.error(response.data.message || 'Failed to update category');
        }
      } else {
        // Create new category
        const response = await apiClient.post('/blog/categories', formData);
        if (response.data.success) {
          toast.success('Category created successfully');
          handleCloseModal();
          fetchCategories();
        } else {
          toast.error(response.data.message || 'Failed to create category');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save category';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await apiClient.delete(`/blog/categories/${id}`);
        if (response.data.success) {
          toast.success('Category deleted successfully');
          fetchCategories();
        } else {
          toast.error(response.data.message || 'Failed to delete category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        const errorMessage = error.response?.data?.error?.message || 'Failed to delete category';
        toast.error(errorMessage);
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-aqua">Category Management</h1>
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-aqua text-background px-4 py-2 rounded-md hover:bg-aqua-dark transition-colors flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Category
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aqua"></div>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          {categories.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>No categories found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Slug
                  </th>
                  {isAdmin && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-700">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{category.slug}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleOpenModal(category)} 
                          className="text-aqua hover:text-aqua-dark mr-3"
                        >
                          <FiEdit className="inline" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(category._id)} 
                          className="text-pink hover:text-pink-dark"
                        >
                          <FiTrash className="inline" /> Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        category={currentCategory}
        onSubmit={handleSubmit}
        isEditing={isEditing}
      />
    </div>
  );
};

export default Categories; 