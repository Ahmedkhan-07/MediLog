'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSession = async () => {
        try {
            const res = await fetch('/api/auth/session');
            const data = await res.json();
            setSession(data.session || null);
        } catch (err) {
            setSession(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();
    }, []);

    const update = async (newSessionData) => {
        // Optimistic update
        setSession((prev) => prev ? { user: { ...prev.user, ...newSessionData } } : null);
        await fetchSession(); // Refresh from server to ensure sync
    };

    return (
        <SessionContext.Provider value={{ data: session, status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated', update }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}
