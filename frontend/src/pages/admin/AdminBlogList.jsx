import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';

const AdminBlogList = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const { data } = await client.get('/blogs/admin');
            setBlogs(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const deleteBlog = async (id) => {
        if (window.confirm('Are you sure you want to delete this blog post?')) {
            try {
                await client.delete(`/blogs/id/${id}`);
                setBlogs(blogs.filter(blog => blog._id !== id));
            } catch (error) {
                console.error(error);
                alert('Failed to delete blog post');
            }
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                        &larr; Back to Dashboard
                    </Link>
                </div>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Manage Blog Posts</h1>
                    <Link to="/admin/blogs/new" className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition">
                        <Plus size={20} /> Create New Post
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Title</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {blogs.map(blog => (
                                    <tr key={blog._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{blog.title}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{blog.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${blog.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {blog.published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(blog.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <Link to={`/admin/blogs/edit/${blog._id}`} className="text-blue-600 hover:text-blue-900 inline-block" title="Edit">
                                                <Edit size={18} />
                                            </Link>
                                            <button onClick={() => deleteBlog(blog._id)} className="text-red-600 hover:text-red-900 inline-block" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                            <Link to={`/blog/${blog.slug}`} target="_blank" className="text-gray-400 hover:text-gray-600 inline-block" title="View">
                                                <Eye size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {blogs.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                            No blog posts found. Create your first one!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBlogList;
