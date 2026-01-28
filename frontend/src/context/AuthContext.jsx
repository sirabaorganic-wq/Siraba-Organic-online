import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    });
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        try {
            const { data } = await client.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token); // Separate token for axios interceptor
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await client.post('/auth/register', { name, email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    const updateProfile = async (profileData) => {
        try {
            const { data } = await client.put('/auth/profile', profileData);
            setUser(data); // data contains the updated user object with token
            localStorage.setItem('userInfo', JSON.stringify(data));
            // Token usually doesn't change on profile update unless we want it to, but backend sends it back so we can perform check
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Update failed'
            };
        }
    };

    const toggleWishlist = async (productId) => {
        try {
            const { data } = await client.post(`/auth/wishlist/${productId}`);
            const updatedUser = { ...user, wishlist: data.wishlist };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            return { success: true, message: data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to update wishlist' };
        }
    };

    const fetchWishlist = async () => {
        try {
            const { data } = await client.get('/auth/wishlist');
            // This returns array of full product objects
            return data;
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
            return [];
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateProfile, toggleWishlist, fetchWishlist, loading, isAdmin: user?.isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};
