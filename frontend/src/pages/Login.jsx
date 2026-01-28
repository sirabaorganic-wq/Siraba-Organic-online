import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Toggle between Login and Register
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let result;
        if (isRegistering) {
            result = await register(name, email, password);
        } else {
            result = await login(email, password);
        }

        if (result.success) {
            // Check if admin to decide redirect
            const user = JSON.parse(localStorage.getItem('userInfo'));
            if (user?.isAdmin) {
                navigate('/admin/dashboard');
            } else {
                navigate(from);
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen pt-24 bg-background flex items-center justify-center">
            <div className="bg-surface p-8 max-w-sm w-full rounded-sm shadow-lg border border-secondary/10">
                <div className="flex justify-center mb-6 text-primary">
                    {isRegistering ? <User size={48} /> : <Lock size={48} />}
                </div>
                <h1 className="font-heading text-2xl font-bold text-center text-primary mb-6">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-500 text-sm p-3 mb-4 rounded-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none transition-colors"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none transition-colors"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-surface py-3 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg mt-4"
                    >
                        {isRegistering ? 'Register' : 'Login'}
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-text-secondary underline hover:text-primary"
                        >
                            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
