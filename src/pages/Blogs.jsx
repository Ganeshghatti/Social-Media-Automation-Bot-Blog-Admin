import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/api";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiTrash,
  FiPlus,
  FiX,
  FiEye,
  FiImage,
  FiCheck,
} from "react-icons/fi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";

// Blog Modal Component for Create/Edit
const BlogModal = ({ isOpen, onClose, categories, blogToEdit = null }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    status: "private",
    categories: [],
    thumbnailImageAlt: "",
    coverImageAlt: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Initialize form with existing blog data if editing
  useEffect(() => {
    if (blogToEdit) {
      setFormData({
        title: blogToEdit.title || "",
        description: blogToEdit.description || "",
        content: blogToEdit.content || "",
        status: blogToEdit.status || "private",
        categories: blogToEdit.categories || [],
        thumbnailImageAlt: blogToEdit.thumbnailImageAlt || "",
        coverImageAlt: blogToEdit.coverImageAlt || "",
      });
      setSelectedCategories(
        blogToEdit.categories?.map((cat) =>
          typeof cat === "object" ? cat._id : cat
        ) || []
      );
      setThumbnailPreview(
        blogToEdit.thumbnailImageUrl || blogToEdit.thumbnailImage || null
      );
      setCoverPreview(
        blogToEdit.coverImageUrl || blogToEdit.coverImage || null
      );
    } else {
      setThumbnailPreview(null);
      setCoverPreview(null);
    }
  }, [blogToEdit]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      status: "private",
      categories: [],
      thumbnailImageAlt: "",
      coverImageAlt: "",
    });
    setThumbnailFile(null);
    setCoverFile(null);
    setThumbnailPreview(null);
    setCoverPreview(null);
    setSelectedCategories([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleThumbnailSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (!blogToEdit && !thumbnailFile) {
      toast.error("Thumbnail image is required");
      return;
    }

    if (!blogToEdit && !coverFile) {
      toast.error("Cover image is required");
      return;
    }

    setSubmitting(true);

    try {
      let thumbnailUrl = blogToEdit?.thumbnailImage || "";
      let coverUrl = blogToEdit?.coverImage || "";

      if (thumbnailFile || coverFile) {
        let presignedUrl = `/blog/presigned-url?mode=${
          blogToEdit ? "edit" : "create"
        }`;
        if (blogToEdit) {
          presignedUrl += `&blogId=${blogToEdit._id}`;
          if (thumbnailFile && !coverFile) {
            presignedUrl += "&imageType=Thumbnail";
          } else if (!thumbnailFile && coverFile) {
            presignedUrl += "&imageType=CoverImage";
          } else if (thumbnailFile && coverFile) {
            presignedUrl += "&imageType=both";
          }
        }

        const presignedResponse = await apiClient.get(presignedUrl);
        if (!presignedResponse.data.success) {
          throw new Error(
            presignedResponse.data.message || "Failed to get upload URLs"
          );
        }

        const presignedData = presignedResponse.data.data;
        console.log("Presigned URL Response:", presignedResponse.data);

        if (thumbnailFile) {
          const thumbnailBlob = await fetch(
            URL.createObjectURL(thumbnailFile)
          ).then((r) => r.blob());
          const uploadResult = await axios.put(
            presignedData.thumbnailImage.presignedUrl,
            thumbnailBlob,
            { headers: { "Content-Type": thumbnailFile.type } }
          );
          console.log("Thumbnail Upload Result:", uploadResult);

          if (uploadResult.status !== 200) {
            throw new Error("Failed to upload thumbnail image");
          }
          thumbnailUrl = presignedData.thumbnailImage.s3Url;
        }

        if (coverFile) {
          const coverBlob = await fetch(URL.createObjectURL(coverFile)).then(
            (r) => r.blob()
          );
          const uploadResult = await axios.put(
            presignedData.coverImage.presignedUrl,
            coverBlob,
            { headers: { "Content-Type": coverFile.type } }
          );
          console.log("Cover Image Upload Result:", uploadResult);

          if (uploadResult.status !== 200) {
            throw new Error("Failed to upload cover image");
          }
          coverUrl = presignedData.coverImage.s3Url;
        }
      }

      const blogData = {
        ...formData,
        categories: selectedCategories,
        thumbnailImage: thumbnailUrl,
        coverImage: coverUrl,
      };

      let createResponse;
      if (blogToEdit) {
        createResponse = await apiClient.put(
          `/blog/posts/${blogToEdit.slug}`,
          blogData
        );
        console.log("Update Blog Response:", createResponse.data);
      } else {
        createResponse = await apiClient.post("/blog/posts", blogData);
        console.log("Create Blog Response:", createResponse.data);
      }

      if (createResponse.data.success) {
        toast.success(
          blogToEdit ? "Blog updated successfully" : "Blog created successfully"
        );
        resetForm();
        onClose();
        window.location.reload();
      } else {
        throw new Error(
          createResponse.data.message ||
            `Failed to ${blogToEdit ? "update" : "create"} blog`
        );
      }
    } catch (error) {
      console.error(
        `Error ${blogToEdit ? "updating" : "creating"} blog:`,
        error
      );
      toast.error(
        error.message || `Failed to ${blogToEdit ? "update" : "create"} blog`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-aqua">
            {blogToEdit ? "Edit Blog" : "Create New Blog"}
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-text font-medium mb-1"
                  >
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
                  <label
                    htmlFor="description"
                    className="block text-text font-medium mb-1"
                  >
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
                  <label
                    htmlFor="status"
                    className="block text-text font-medium mb-1"
                  >
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
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-text font-medium mb-1">
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-background border border-gray-700 rounded-md min-h-[100px]">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        onClick={() => toggleCategory(category._id)}
                        className={`px-3 py-1 rounded-full cursor-pointer flex items-center ${
                          selectedCategories.includes(category._id)
                            ? "bg-aqua text-background"
                            : "bg-gray-700 text-text"
                        }`}
                      >
                        {category.name}
                        {selectedCategories.includes(category._id) ? (
                          <FiX className="ml-1" />
                        ) : (
                          <FiPlus className="ml-1" />
                        )}
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <div className="text-gray-400">
                        No categories available
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-text font-medium mb-1">
                    Thumbnail Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                  />
                  {thumbnailPreview && (
                    <div className="mt-2">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail Preview"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  {thumbnailFile ? (
                    <div className="mt-2 text-sm text-green-400">
                      <FiCheck className="inline mr-1" /> {thumbnailFile.name}{" "}
                      selected
                    </div>
                  ) : (
                    blogToEdit && (
                      <div className="mt-2 text-sm text-gray-400">
                        Current: {blogToEdit.thumbnailImage.split("/").pop()}
                      </div>
                    )
                  )}
                </div>

                <div>
                  <label
                    htmlFor="thumbnailImageAlt"
                    className="block text-text font-medium mb-1"
                  >
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

                <div>
                  <label className="block text-text font-medium mb-1">
                    Cover Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua"
                  />
                  {coverPreview && (
                    <div className="mt-2">
                      <img
                        src={coverPreview}
                        alt="Cover Preview"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  {coverFile ? (
                    <div className="mt-2 text-sm text-green-400">
                      <FiCheck className="inline mr-1" /> {coverFile.name}{" "}
                      selected
                    </div>
                  ) : (
                    blogToEdit && (
                      <div className="mt-2 text-sm text-gray-400">
                        Current: {blogToEdit.coverImage.split("/").pop()}
                      </div>
                    )
                  )}
                </div>

                <div>
                  <label
                    htmlFor="coverImageAlt"
                    className="block text-text font-medium mb-1"
                  >
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

            <div>
              <label className="block text-text font-medium mb-1">
                Content *
              </label>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                className="bg-background text-text"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ indent: "-1" }, { indent: "+1" }],
                    [{ align: [] }],
                    ["link", "image", "code-block"],
                    ["clean"],
                  ],
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 bg-gray-700 text-text rounded-md hover:bg-gray-600 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-aqua text-background rounded-md hover:bg-aqua-dark"
              >
                {submitting
                  ? blogToEdit
                    ? "Updating..."
                    : "Creating..."
                  : blogToEdit
                  ? "Update Blog"
                  : "Create Blog"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Blog Modal
const ViewBlogModal = ({ isOpen, onClose, blog }) => {
  if (!isOpen || !blog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-aqua">{blog.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {blog.coverImageUrl && (
            <div className="mb-4">
              <img
                src={blog.coverImageUrl}
                alt={blog.coverImageAlt || blog.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {blog.categories?.map((category) => (
              <span
                key={typeof category === "object" ? category._id : category}
                className="px-2 py-1 bg-gray-700 text-sm rounded-full"
              >
                {typeof category === "object" ? category.name : category}
              </span>
            ))}
          </div>

          <div className="text-gray-300 mb-4">
            <p>{blog.description}</p>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>

          <div className="border-t border-gray-700 pt-4 mt-6">
            <h3 className="text-lg font-medium text-aqua mb-2">Blog Details</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-400">Status:</span> {blog.status}
              </li>
              <li>
                <span className="text-gray-400">Created:</span>{" "}
                {new Date(blog.createdAt).toLocaleString()}
              </li>
              <li>
                <span className="text-gray-400">Updated:</span>{" "}
                {new Date(blog.updatedAt).toLocaleString()}
              </li>
              <li>
                <span className="text-gray-400">Authors:</span>{" "}
                {blog.authors
                  ?.map((author) =>
                    typeof author === "object" ? author.username : author
                  )
                  .join(", ")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Blogs Component
const Blogs = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = user?.role === "admin";
  const isAuthor = user?.role === "author" || isAdmin;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch blogs
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/blog/posts");
      if (response.data.success) {
        setBlogs(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load blogs");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      const errorMessage =
        error.response?.data?.error?.message || "Failed to load blogs";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for the dropdown
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/blog/categories");
      if (response.data.success) {
        setCategories(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBlogs();
      fetchCategories();
    }
  }, [isAuthenticated]);

  const handleOpenModal = (blog = null) => {
    if (blog) {
      setCurrentBlog(blog);
      setIsEditing(true);
    } else {
      setCurrentBlog(null);
      setIsEditing(false);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentBlog(null);
    setIsEditing(false);
  };

  const handleOpenViewModal = async (blogId) => {
    try {
      const response = await apiClient.get(`/blog/posts/${blogId}`);
      if (response.data.success) {
        setCurrentBlog(response.data.data);
        setViewModalOpen(true);
      } else {
        toast.error(response.data.message || "Failed to load blog details");
      }
    } catch (error) {
      console.error("Error fetching blog details:", error);
      const errorMessage =
        error.response?.data?.error?.message || "Failed to load blog details";
      toast.error(errorMessage);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setCurrentBlog(null);
  };

  const handleSubmit = async (formData, tempBlogId) => {
    try {
      if (isEditing) {
        // Update existing blog
        const response = await apiClient.put(
          `/blog/posts/${currentBlog.slug}`,
          formData
        );
        if (response.data.success) {
          toast.success("Blog updated successfully");
          handleCloseModal();
          fetchBlogs();
        } else {
          toast.error(response.data.message || "Failed to update blog");
        }
      } else {
        // Create new blog
        const response = await apiClient.post("/blog/posts", formData);
        if (response.data.success) {
          toast.success("Blog created successfully");
          handleCloseModal();
          fetchBlogs();
        } else {
          toast.error(response.data.message || "Failed to create blog");
        }
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      const errorMessage =
        error.response?.data?.error?.message || "Failed to save blog";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this blog? This action cannot be undone."
      )
    ) {
      try {
        const response = await apiClient.delete(`/blog/posts/${id}`);
        if (response.data.success) {
          toast.success("Blog deleted successfully");
          fetchBlogs();
        } else {
          toast.error(response.data.message || "Failed to delete blog");
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        const errorMessage =
          error.response?.data?.error?.message || "Failed to delete blog";
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
        <h1 className="text-2xl font-bold text-aqua">Blog Management</h1>
        {isAuthor && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-aqua text-background px-4 py-2 rounded-md hover:bg-aqua-dark transition-colors flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Blog
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-aqua"></div>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          {blogs.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>
                No blogs found. {isAuthor ? "Create your first blog post!" : ""}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Categories
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-700">
                  {blogs.map((blog) => (
                    <tr key={blog._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text">
                          {blog.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            blog.status === "public"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {blog.categories?.map((category, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-gray-700 rounded-full"
                            >
                              {typeof category === "object"
                                ? category.name
                                : category}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenViewModal(blog.slug)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FiEye className="inline" /> View
                        </button>
                        {(isAdmin ||
                          blog.authors.some(
                            (author) =>
                              (typeof author === "object" &&
                                author._id === user?._id) ||
                              author === user?._id
                          )) && (
                          <>
                            <button
                              onClick={() => handleOpenModal(blog)}
                              className="text-aqua hover:text-aqua-light"
                            >
                              <FiEdit className="inline" /> Edit
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(blog.slug)}
                                className="text-pink hover:text-pink-dark"
                              >
                                <FiTrash className="inline" /> Delete
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Blog Modal */}
      <BlogModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        categories={categories}
        blogToEdit={currentBlog}
      />

      <ViewBlogModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        blog={currentBlog}
      />
    </div>
  );
};

export default Blogs;
