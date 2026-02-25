'use client';
import { createContext, useContext, useState } from 'react';

const AuthUIContext = createContext();

export function AuthUIProvider({ children }) {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [redirectPath, setRedirectPath] = useState(null);
    const [modalMode, setModalMode] = useState('login'); // 'login' or 'register'
    const [loginMessage, setLoginMessage] = useState(null);
    const [loginType, setLoginType] = useState('normal'); // 'normal' | 'session_expired'

    const showLogin = (path = null, message = null, type = 'normal') => {
        setRedirectPath(path);
        setLoginMessage(message);
        setLoginType(type);
        setModalMode('login');
        setIsLoginModalOpen(true);
    };

    const showRegister = (path = null) => {
        setRedirectPath(path);
        setLoginMessage(null);
        setLoginType('normal');
        setModalMode('register');
        setIsLoginModalOpen(true);
    };

    const hideLogin = () => {
        setIsLoginModalOpen(false);
        setRedirectPath(null);
        setLoginMessage(null);
        setLoginType('normal');
        setModalMode('login');
    };

    const value = {
        isLoginModalOpen,
        showLogin,
        showRegister,
        hideLogin,
        redirectPath,
        modalMode,
        loginMessage,
        loginType
    };

    return (
        <AuthUIContext.Provider value={value}>
            {children}
        </AuthUIContext.Provider>
    );
}

export function useAuthUI() {
    const context = useContext(AuthUIContext);
    if (context === undefined) {
        throw new Error('useAuthUI must be used within an AuthUIProvider');
    }
    return context;
}
