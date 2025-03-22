import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiSave, FiX, FiImage, FiArrowLeft } from 'react-icons/fi';

const EditBlog = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isNewBlog = blogId === 'new';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState({
    thumbnail: false,
    cover: false
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    status: 'private',
    categories: [],
    thumbnailImage: '',
    coverImage: '',
    thumbnailImageAlt: '',
    coverImageAlt: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch blog data and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesResponse = await apiClient.get('/blog/categories');
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data || []);
        }
        
        // If editing existing blog, fetch blog data
        if (!isNewBlog) {
          const blogResponse = await apiClient.get(`/blog/posts/${blogId}`);
          if (blogResponse.data.success) {
            const blog = blogResponse.data.data;
            
            // Check if user is author or admin
            const isAuthor = blog.authors.some(author => 
              (typeof author === 'object' && author._id === user?._id) || 
              author === user?._id
            );
            
            if (!isAuthor && user?.role !== 'admin') {
              toast.error('You do not have permission to edit this blog');
              navigate('/blogs');
              return;
            }
            
            setFormData({
              title: blog.title || '',
              description: blog.description || '',
              content: blog.content || '',
              metaTitle: blog.metaTitle || '',
              metaDescription: blog.metaDescription || '',
              metaKeywords: Array.isArray(blog.metaKeywords) ? blog.metaKeywords : [],
              status: blog.status || 'private',
              categories: blog.categories?.map(cat => typeof cat === 'object' ? cat._id : cat) || [],
              thumbnailImage: blog.thumbnailImage || '',
              coverImage: blog.coverImage || '',
              thumbnailImageAlt: blog.thumbnailImageAlt || '',
              coverImageAlt: blog.coverImageAlt || ''
            });
          } else {
            toast.error('Failed to load blog data');
            navigate('/blogs');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = error.response?.data?.error?.message || 'An error occurred';
        toast.error(errorMessage);
        navigate('/blogs');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, blogId, isNewBlog, navigate, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'categories') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, [name]: selectedOptions }));
    } else if (name === 'metaKeywords') {
      // Split by comma and trim whitespace
      const keywordsArray = value.split(',').map(keyword => keyword.trim()).filter(Boolean);
      setFormData(prev => ({ ...prev, [name]: keywordsArray }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleImageUpload = async (imageType) => {
    try {
      if (imageType === 'thumbnail') {
        setUploading(prev => ({ ...prev, thumbnail: true }));
      } else {
        setUploading(prev => ({ ...prev, cover: true }));
      }
      
      // Get presigned URL
      const mode = isNewBlog ? 'create' : 'edit';
      const endpoint = `/blog/presigned-url?mode=${mode}${!isNewBlog ? `&blogId=${blogId}` : ''}&imageType=${imageType === 'thumbnail' ? 'thumbnailImage' : 'coverImage'}`;
      
      const presignedResponse = await apiClient.get(endpoint);
      
      if (!presignedResponse.data.success) {
        throw new Error(presignedResponse.data.message || 'Failed to get upload URL');
      }
      
      // Extract the presigned URL and S3 URL
      const { presignedUrl, s3Url } = presignedResponse.data.data[imageType === 'thumbnail' ? 'thumbnailImage' : 'coverImage'];
      
      // Get file from user
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // Create a promise to handle the file selection
      const fileSelected = new Promise((resolve) => {
        input.onchange = (e) => {
          resolve(e.target.files[0]);
        };
      });
      
      input.click();
      
      // Wait for file selection
      const file = await fileSelected;
      
      if (!file) {
        if (imageType === 'thumbnail') {
          setUploading(prev => ({ ...prev, thumbnail: false }));
        } else {
          setUploading(prev => ({ ...prev, cover: false }));
        }
        return;
      }
      
      // Upload to S3 using presigned URL
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      // Update form data with the S3 URL
      setFormData(prev => ({
        ...prev,
        [imageType === 'thumbnail' ? 'thumbnailImage' : 'coverImage']: s3Url
      }));
      
      toast.success(`${imageType === 'thumbnail' ? 'Thumbnail' : 'Cover'} image uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${imageType} image:`, error);
      toast.error(`Failed to upload ${imageType} image: ${error.message}`);
    } finally {
      if (imageType === 'thumbnail') {
        setUploading(prev => ({ ...prev, thumbnail: false }));
      } else {
        setUploading(prev => ({ ...prev, cover: false }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        metaKeywords: formData.metaKeywords
      };
      
      let response;
      
      if (isNewBlog) {
        // Create new blog
        response = await apiClient.post('/blog/posts', payload);
      } else {
        // Update existing blog
        response = await apiClient.put(`/blog/posts/${blogId}`, payload);
      }
      
      if (response.data.success) {
        toast.success(isNewBlog ? 'Blog created successfully' : 'Blog updated successfully');
        navigate('/blogs');
      } else {
        toast.error(response.data.message || 'Failed to save blog');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save blog';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/blogs')}
            className="mr-4 text-gray-400 hover:text-white"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-aqua">
            {isNewBlog ? 'Create New Blog' : 'Edit Blog'}
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/blogs')}
            className="px-4 py-2 border border-gray-600 rounded-md text-text hover:bg-gray-700 flex items-center"
          >
            <FiX className="mr-2" /> Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-aqua text-background px-4 py-2 rounded-md hover:bg-aqua-dark transition-colors flex items-center"
          >
            <FiSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Blog'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aqua"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-aqua mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-text font-medium mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-text font-medium mb-1">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-text font-medium mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="categories" className="block text-text font-medium mb-1">
                      Categories
                    </label>
                    <select
                      id="categories"
                      name="categories"
                      multiple
                      value={formData.categories}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                      size="4"
                    >
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple categories</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-aqua mb-4">SEO & Meta</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="metaTitle" className="block text-text font-medium mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      id="metaTitle"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="metaDescription" className="block text-text font-medium mb-1">
                      Meta Description
                    </label>
                    <textarea
                      id="metaDescription"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="metaKeywords" className="block text-text font-medium mb-1">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      id="metaKeywords"
                      name="metaKeywords"
                      value={formData.metaKeywords.join(', ')}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                    <p className="text-xs text-gray-400 mt-1">Separate keywords with commas</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-aqua mb-4">Images</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-text font-medium mb-1">
                    Thumbnail Image
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleImageUpload('thumbnail')}
                      disabled={uploading.thumbnail}
                      className="px-3 py-2 bg-gray-700 text-text rounded-md hover:bg-gray-600 flex items-center"
                    >
                      <FiImage className="mr-2" />
                      {uploading.thumbnail ? 'Uploading...' : 'Upload Image'}
                    </button>
                    
                    <input
                      type="text"
                      name="thumbnailImage"
                      value={formData.thumbnailImage}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                      placeholder="S3 URL will appear here"
                      readOnly
                    />
                  </div>
                  
                  <div className="mt-2">
                    <label htmlFor="thumbnailImageAlt" className="block text-text font-medium mb-1">
                      Thumbnail Alt Text
                    </label>
                    <input
                      type="text"
                      id="thumbnailImageAlt"
                      name="thumbnailImageAlt"
                      value={formData.thumbnailImageAlt}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-text font-medium mb-1">
                    Cover Image
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleImageUpload('cover')}
                      disabled={uploading.cover}
                      className="px-3 py-2 bg-gray-700 text-text rounded-md hover:bg-gray-600 flex items-center"
                    >
                      <FiImage className="mr-2" />
                      {uploading.cover ? 'Uploading...' : 'Upload Image'}
                    </button>
                    
                    <input
                      type="text"
                      name="coverImage"
                      value={formData.coverImage}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                      placeholder="S3 URL will appear here"
                      readOnly
                    />
                  </div>
                  
                  <div className="mt-2">
                    <label htmlFor="coverImageAlt" className="block text-text font-medium mb-1">
                      Cover Alt Text
                    </label>
                    <input
                      type="text"
                      id="coverImageAlt"
                      name="coverImageAlt"
                      value={formData.coverImageAlt}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-aqua mb-4">Content</h2>
              
              <div>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={handleContentChange}
                  className="bg-background text-text"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'indent': '-1'}, { 'indent': '+1' }],
                      [{ 'align': [] }],
                      ['link', 'image', 'code-block'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditBlog; 