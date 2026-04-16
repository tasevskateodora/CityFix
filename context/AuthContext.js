import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, getMe } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const username = await SecureStore.getItemAsync('username');
            const password = await SecureStore.getItemAsync('password');
            if (username && password) {
                const res = await getMe();
                setUser(res.data);
            }
        } catch (e) {
            await SecureStore.deleteItemAsync('username');
            await SecureStore.deleteItemAsync('password');
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        // Store credentials first so interceptor can use them
        await SecureStore.setItemAsync('username', username);
        await SecureStore.setItemAsync('password', password);
        try {
            const res = await getMe();
            setUser(res.data);
            return res.data;
        } catch (e) {
            await SecureStore.deleteItemAsync('username');
            await SecureStore.deleteItemAsync('password');
            throw e;
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('username');
        await SecureStore.deleteItemAsync('password');
        setUser(null);
    };

    const refreshUser = async () => {
        const res = await getMe();
        setUser(res.data);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);