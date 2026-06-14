import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  LogOut,
  Settings,
  AlertCircle,
  Check,
  ChevronLeft
} from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import client from "../../api/client";

const BlogCreatorDashboard = () => {
  const { user, logout } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, create, edit
  const [currentBlogId, setCurrentBlogId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    image: "",
    category: "General",
    tags: "",
    featured: false
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      // getAdminBlogs controller will filter by authorId automatically if user has role blog_creator
      const { data } = await client.get("/blogs/admin");
      setBlogs(data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      image: "",
      category: "General",
      tags: "",
      featured: false
    });
    setCurrentBlogId(null);
    setView("create");
  };

  const handleEditClick = (blog) => {
    setFormData({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      image: blog.image || "",
      category: blog.category || "General",
      tags: blog.tags ? blog.tags.join(", ") : "",
      featured: blog.featured || false
    });
    setCurrentBlogId(blog._id);
    setView("edit");
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await client.delete(`/blogs/id/${id}`);
        setSuccess("Blog post deleted successfully!");
        fetchBlogs();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        console.error(err);
        setError("Failed to delete blog post");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleContentChange = (content) => {
    setFormData({ ...formData, content });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !formData.content || !formData.image) {
      setError("Please fill in all required fields (Title, Excerpt, Content, Image URL)");
      return;
    }

    const payload = {
      ...formData,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : []
    };

    try {
      if (view === "edit") {
        await client.put(`/blogs/id/${currentBlogId}`, payload);
        setSuccess("Blog updated and resubmitted for approval!");
      } else {
        await client.post("/blogs", payload);
        setSuccess("Blog post created and submitted for approval!");
      }
      setView("list");
      fetchBlogs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save blog post");
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      ["link", "image", "video"],
      ["clean"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }]
    ]
  };

  const formats = [
    "header",
    "font",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "video",
    "color",
    "background",
    "align"
  ];

  if (!user || user.role !== "blog_creator") {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="min-h-screen bg-background pt-20 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-secondary/10 hidden md:flex flex-col fixed left-0 top-20 bottom-0 z-20">
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="flex items-center gap-3 text-primary mb-8">
            <Settings size={24} />
            <span className="font-heading font-bold text-xl">Creator Portal</span>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setView("list")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors ${
                view === "list"
                  ? "bg-primary text-surface"
                  : "text-text-secondary hover:bg-secondary/5"
              }`}
            >
              <FileText size={18} />
              My Blog Posts
            </button>
          </nav>
        </div>
        <div className="p-6 border-t border-secondary/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-sm transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-grow md:ml-64 p-6 md:p-8 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          {/* Top Info Header */}
          <div className="flex justify-between items-center mb-8 border-b border-secondary/10 pb-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-primary">Blog Creation Panel</h1>
              <p className="text-sm text-text-secondary mt-1">Logged in as: {user.name} ({user.email})</p>
            </div>
            <button onClick={logout} className="md:hidden flex items-center gap-2 text-red-500 font-medium">
              <LogOut size={18} /> Logout
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-4 mb-6 rounded-sm flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 border border-green-100 p-4 mb-6 rounded-sm flex items-center gap-2">
              <Check size={20} />
              <span>{success}</span>
            </div>
          )}

          {view === "list" ? (
            <div className="bg-surface rounded-sm border border-secondary/10 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-secondary/10 flex justify-between items-center bg-white">
                <h2 className="text-xl font-bold text-primary">My Blog Submissions</h2>
                <button
                  onClick={handleCreateClick}
                  className="bg-primary hover:bg-primary/95 text-surface px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-2 shadow-md transition-all"
                >
                  <Plus size={16} /> Create New Post
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-text-secondary">Loading your blog posts...</div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  No blogs found. Go ahead and write your first post!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/5 text-text-secondary font-medium uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Approval Status</th>
                        <th className="px-6 py-4">Date Created</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/10">
                      {blogs.map((blog) => (
                        <tr key={blog._id} className="hover:bg-secondary/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-primary">{blog.title}</div>
                            <div className="text-xs text-text-secondary truncate max-w-xs">{blog.slug}</div>
                          </td>
                          <td className="px-6 py-4 text-text-secondary">{blog.category}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full ${
                              blog.approvalStatus === "approved"
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : blog.approvalStatus === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                            }`}>
                              {blog.approvalStatus || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-text-secondary">
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button
                              onClick={() => handleEditClick(blog)}
                              className="text-blue-600 hover:text-blue-900 inline-block"
                              title="Edit Blog"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(blog._id)}
                              className="text-red-600 hover:text-red-900 inline-block"
                              title="Delete Blog"
                            >
                              <Trash2 size={16} />
                            </button>
                            {blog.approvalStatus === "approved" && (
                              <a
                                href={`/blog/${blog.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-text-secondary hover:text-primary inline-block"
                                title="View on Site"
                              >
                                <Eye size={16} />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // Form Editor View
            <div className="bg-surface rounded-sm border border-secondary/10 shadow-sm p-6 md:p-8 bg-white animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setView("list")}
                  className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1 font-bold uppercase tracking-wider text-xs"
                >
                  <ChevronLeft size={16} /> Back to List
                </button>
              </div>

              <h2 className="font-heading text-xl font-bold text-primary mb-6">
                {view === "edit" ? "Edit Blog Post (requires re-approval)" : "Draft New Blog Post"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none text-sm font-medium"
                    placeholder="Enter an engaging title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Short Excerpt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none text-sm"
                    rows="3"
                    placeholder="Provide a short teaser or description of the post..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Featured Image URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none text-sm"
                      placeholder="https://example.com/blog-image.jpg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none text-sm"
                      placeholder="e.g. Health, Recipes, Lifestyle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none text-sm"
                    placeholder="e.g. organic, saffron, wellness"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-secondary/20 rounded-sm overflow-hidden bg-background">
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={handleContentChange}
                      modules={modules}
                      formats={formats}
                      className="h-96 mb-12"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-secondary/10">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="px-6 py-2 border border-secondary/20 hover:bg-secondary/5 rounded-sm text-xs font-bold uppercase tracking-wider text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary hover:bg-primary/95 text-surface rounded-sm text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                  >
                    Submit for Approval
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlogCreatorDashboard;
