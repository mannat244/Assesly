'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

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
    const [user, setUser] = useState(null);
    // Default to true so we don't flash login screen while checking session
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // effective check for session persistence
    useEffect(() => {
        async function checkUser() {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.isLoggedIn) {
                        setUser(data);
                        saveUserToLocalStorage(data);
                    } else {
                        setUser(null);
                        clearUserFromLocalStorage();
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
