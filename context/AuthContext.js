'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
    user: null,
    loading: true,
    login: async () => ({ success: false, error: 'Auth not initialized' }),
    signup: async () => ({ success: false, error: 'Auth not initialized' }),
    logout: async () => { },
});

// Helper functions for localStorage operations
const saveUserToLocalStorage = (userData) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
    }
};

const clearUserFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
    }
};

export function AuthProvider({ children }) {
    // Initialize user as null to ensure server/client match (Fixes Hydration Error)
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 1. Optimistic Check from LocalStorage (Client-side only)
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('user');
                if (stored) {
                    setUser(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }

        // 2. Authoritative Check from Server
        async function checkUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.isLoggedIn) {
                        setUser(data); // Sync with server truth
                        saveUserToLocalStorage(data);
                    } else {
                        // Server says not logged in
                        if (localStorage.getItem('user')) {
                            // Only clear if we actually had something, to avoid unnecessary state updates
                            setUser(null);
                            clearUserFromLocalStorage();
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        }
        checkUser();
    }, []);

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            const userData = { ...data.user, isLoggedIn: true };
            setUser(userData);
            saveUserToLocalStorage(userData);
            return { success: true };
        } else {
            return { success: false, error: data.message };
        }
    };

    const signup = async (name, email, password) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            const userData = { ...data.user, isLoggedIn: true };
            setUser(userData);
            saveUserToLocalStorage(userData);
            return { success: true };
        } else {
            return { success: false, error: data.message };
        }
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        clearUserFromLocalStorage();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
