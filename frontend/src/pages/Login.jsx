import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import client from '../api/client';
import OTPModal from '../components/OTPModal';

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
    const [emailOtpModalOpen, setEmailOtpModalOpen] = useState(false);
    const [pendingRegistration, setPendingRegistration] = useState(null);

    const [loading, setLoading] = useState(false);
    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isRegistering) {
            try {
                setPendingRegistration({ name, email, password });
                await client.post('/otp/send-email', {
                    email,
                    context: 'User registration',
                });
                setEmailOtpModalOpen(true);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Failed to send verification code. Please try again.'
                );
            } finally {
                setLoading(false);
            }
        } else {
            const result = await login(email, password);
            setLoading(false);
            if (result.success) {
                const user = JSON.parse(localStorage.getItem('userInfo'));
                if (user?.isAdmin) {
                    navigate('/admin/dashboard');
                } else {
                    navigate(from);
                }
            } else {
                setError(result.message);
            }
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
                        disabled={loading}
                        className="w-full bg-primary text-surface py-3 font-bold uppercase tracking-widest hover:bg-accent hover:text-primary transition-all duration-300 shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></span>}
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
            <OTPModal
                isOpen={emailOtpModalOpen}
                title="Verify your email"
                description={
                    pendingRegistration
                        ? `We have sent a 6-digit verification code to ${pendingRegistration.email}. Enter it below to complete your registration.`
                        : ''
                }
                onClose={() => setEmailOtpModalOpen(false)}
                onVerify={async (otp) => {
                    if (!pendingRegistration) return;
                    const { name: regName, email: regEmail, password: regPassword } = pendingRegistration;
                    const result = await register(regName, regEmail, regPassword, {
                        emailOtp: otp,
                    });
                    if (!result.success) {
                        throw new Error(result.message);
                    }
                    setEmailOtpModalOpen(false);
                    setPendingRegistration(null);
                    const user = JSON.parse(localStorage.getItem('userInfo'));
                    if (user?.isAdmin) {
                        navigate('/admin/dashboard');
                    } else {
                        navigate(from);
                    }
                }}
                onResend={async () => {
                    if (!pendingRegistration) return;
                    await client.post('/otp/send-email', {
                        email: pendingRegistration.email,
                        context: 'User registration',
                    });
                }}
            />
        </div>
    );
};

export default Login;
