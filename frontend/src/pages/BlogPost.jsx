import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import parse from 'html-react-parser';
import { Clock, Calendar, ChevronLeft, Share2, Tag } from 'lucide-react';

const BlogPost = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const { data } = await client.get(`/blogs/${slug}`);
                setBlog(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchBlog();
    }, [slug]);

    if (loading) return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;

    if (!blog) return (
        <div className="w-full h-screen flex flex-col items-center justify-center space-y-4 pt-20">
            <h2 className="text-2xl font-bold text-primary">Blog Post Not Found</h2>
            <Link to="/blog" className="text-accent underline">Return to Knowledge Hub</Link>
        </div>
    );

    return (
        <div className="w-full pt-28 pb-20 bg-background min-h-screen">
            <div className="max-w-4xl mx-auto px-6 md:px-8">

                {/* Breadcrumb */}
                <div className="mb-10 text-center">
                    <Link to="/blog" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors tracking-wide">
                        <ChevronLeft size={16} className="mr-1" /> Back to Knowledge Hub
                    </Link>
                </div>

                {/* Article Header */}
                <header className="mb-12 text-center space-y-6">
                    <div className="flex items-center justify-center gap-2">
                        <span className="bg-primary/5 text-primary border border-primary/10 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-widest">
                            {blog.category}
                        </span>
                    </div>

                    <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-primary font-bold leading-tight md:leading-tight">
                        {blog.title}
                    </h1>

                    <div className="flex items-center justify-center gap-4 text-sm text-text-secondary font-medium tracking-wide">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-accent" />
                            {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-secondary/30"></span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-accent" />
                            {blog.readTime} min read
                        </span>
                    </div>
                </header>

                {/* Featured Image */}
                {blog.image && (
                    <div className="w-full aspect-video md:aspect-[21/9] rounded-sm overflow-hidden mb-14 shadow-lg border border-secondary/10">
                        <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                )}

                {/* Article Content */}
                <article className="blog-content w-full">
                    {parse(blog.content)}
                </article>

                {/* Footer / Tags */}
                <div className="mt-16 pt-10 border-t border-secondary/10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {blog.tags.map(tag => (
                                    <span key={tag} className="text-xs font-medium text-primary bg-secondary/10 hover:bg-secondary/20 px-3 py-1.5 rounded-sm transition-colors cursor-default">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Share Article</h3>
                            <div className="flex items-center gap-3">
                                <button className="w-10 h-10 flex items-center justify-center rounded-full border border-secondary/20 text-text-secondary hover:text-primary hover:border-primary transition-all">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BlogPost;
