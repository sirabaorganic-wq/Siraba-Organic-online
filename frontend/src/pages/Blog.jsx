import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import client from '../api/client';

const Blog = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = ['All', 'Education', 'Culinary', 'Health', 'Sustainability', 'General'];

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBlogs();
    }, [selectedCategory]);

    const fetchBlogs = async () => {
        try {
            const url = selectedCategory === 'All' ? '/blogs' : `/blogs?category=${selectedCategory}`;
            const { data } = await client.get(url);
            setBlogs(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="w-full h-screen flex items-center justify-center pt-20">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );

    return (
        <div className="w-full pt-28 pb-20 bg-background text-primary min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <span className="text-secondary text-sm font-bold uppercase tracking-[0.2em]">Knowledge Hub</span>
                    <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary">Stories for a Healthier Life</h1>
                    <p className="text-text-secondary max-w-2xl mx-auto text-lg pt-2">
                        Explore our curated articles on organic living, traditional spices, and wellness.
                    </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-4 justify-center mb-16">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 border rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'border-secondary/20 text-text-secondary hover:bg-primary/5'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Blog Content */}
                {blogs.length > 0 ? (
                    <>
                        {/* Featured Post (First one) */}
                        <div className="mb-20">
                            <Link to={`/blog/${blogs[0].slug}`} className="group relative block overflow-hidden rounded-sm shadow-xl">
                                <div className="aspect-w-16 aspect-h-9 md:aspect-h-6 h-[400px] md:h-[500px]">
                                    <img
                                        src={blogs[0].image}
                                        alt={blogs[0].title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-primary/40 group-hover:bg-primary/30 transition-colors" />
                                </div>
                                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-surface bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center space-x-4 mb-3 text-xs md:text-sm font-bold uppercase tracking-wider text-accent">
                                        <span>{blogs[0].category}</span>
                                        <span>•</span>
                                        <span>{new Date(blogs[0].createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 group-hover:text-accent transition-colors leading-tight">
                                        {blogs[0].title}
                                    </h2>
                                    <p className="hidden md:block text-white/90 max-w-3xl text-lg mb-6 line-clamp-2">
                                        {blogs[0].excerpt}
                                    </p>
                                    <span className="inline-flex items-center space-x-2 font-bold uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform">
                                        <span>Read Article</span>
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* Blog Grid (Remaining posts) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {blogs.slice(1).map(post => (
                                <article key={post._id} className="group flex flex-col h-full bg-surface border border-secondary/10 rounded-sm hover:shadow-lg transition-all duration-300">
                                    <div className="relative h-60 overflow-hidden rounded-t-sm">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider rounded-sm">
                                            {post.category}
                                        </div>
                                    </div>
                                    <div className="flex-1 p-6 md:p-8 flex flex-col">
                                        <div className="flex items-center space-x-4 text-xs text-text-secondary mb-3">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1"><User size={12} /> {post.author.name}</span>
                                        </div>
                                        <h3 className="font-heading text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>
                                        <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                        <Link to={`/blog/${post.slug}`} className="inline-flex items-center space-x-2 text-primary font-bold text-sm uppercase tracking-wider hover:text-accent transition-colors">
                                            <span>Read More</span>
                                            <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 text-text-secondary">
                        <p className="text-xl">No stories found in this category.</p>
                        <button onClick={() => setSelectedCategory('All')} className="mt-4 text-accent underline">View all stories</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog;
