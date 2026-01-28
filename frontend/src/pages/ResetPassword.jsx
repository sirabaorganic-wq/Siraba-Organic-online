import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { resetToken } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { data } = await client.put(`/auth/resetpassword/${resetToken}`, { password });
            setMessage(data.message);
            setTimeout(() => {
                navigate('/account');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-28 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-surface p-8 rounded-sm shadow-xl border border-secondary/10">
                <div className="text-center mb-8">
                    <h1 className="font-heading text-2xl font-bold text-primary mb-2">Reset Password</h1>
                    <p className="text-text-secondary text-sm">Enter your new password below.</p>
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-sm flex items-center gap-2">
                        <CheckCircle size={16} /> {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider block mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-secondary" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-secondary/20 rounded-sm focus:border-accent focus:outline-none transition-colors"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider block mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-secondary" size={18} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-secondary/20 rounded-sm focus:border-accent focus:outline-none transition-colors"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-surface py-3 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg disabled:opacity-70"
                    >
                        {loading ? 'Reseting...' : 'Set New Password'}
                    </button>
                </form>

                <div className="mt-6 text-center pt-6 border-t border-secondary/10">
                    <Link to="/account" className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
