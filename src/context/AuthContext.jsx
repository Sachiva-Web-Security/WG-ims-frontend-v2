'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/me')
                .then(r => setUser(r.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    document.cookie = 'token=; path=/; max-age=0';
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const r = await api.post('/auth/login', { email, password });
        const { token, user: userData } = r.data;
        localStorage.setItem('token', token);
        // Also store in cookie so Next.js middleware can read it
        document.cookie = `token=${token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
