import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (login(username, password)) {
            navigate('/admin/dashboard');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen pt-24 bg-background flex items-center justify-center">
            <div className="bg-surface p-8 max-w-sm w-full rounded-sm shadow-lg border border-secondary/10">
                <div className="flex justify-center mb-6 text-primary">
                    <Lock size={48} />
                </div>
                <h1 className="font-heading text-2xl font-bold text-center text-primary mb-6">Admin Portal</h1>

                {error && (
                    <div className="bg-red-50 text-red-500 text-sm p-3 mb-4 rounded-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                        <input
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-surface py-3 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg mt-4"
                    >
                        Login
                    </button>
                    <p className="text-xs text-center text-text-secondary mt-4">
                        Default: admin / admin123
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
