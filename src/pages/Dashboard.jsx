import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Fetch posts
    const fetchPosts = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await apiClient.get('/blog/posts');
        // setPosts(response.data.data);
        
        // Mock data for demonstration
        setPosts([
          { id: 1, title: 'Getting Started with React', status: 'published', date: '2023-10-15' },
          { id: 2, title: 'Advanced Tailwind CSS', status: 'draft', date: '2023-10-10' },
          { id: 3, title: 'Building a Blog with Node.js', status: 'published', date: '2023-10-05' },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 py-3">
            <Link to="/dashboard" className="text-aqua font-medium">Dashboard</Link>
            <Link to="/authors" className="text-text hover:text-aqua transition-colors">Authors</Link>
            <Link to="/categories" className="text-text hover:text-aqua transition-colors">Categories</Link>
            <Link to="/blogs" className="text-text hover:text-aqua transition-colors">Blogs</Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-400 mb-2">Total Posts</h3>
            <p className="text-3xl font-bold text-aqua">{posts.length}</p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-400 mb-2">Published</h3>
            <p className="text-3xl font-bold text-pink">
              {posts.filter(post => post.status === 'published').length}
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-400 mb-2">Drafts</h3>
            <p className="text-3xl font-bold text-yellow">
              {posts.filter(post => post.status === 'draft').length}
            </p>
          </div>
        </div>
        
        {/* Posts table */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-aqua">Recent Posts</h2>
            <button className="btn-primary">New Post</button>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">Loading posts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {post.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        {post.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-aqua hover:text-aqua-dark mr-3">Edit</button>
                        <button className="text-pink hover:text-pink-dark">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 