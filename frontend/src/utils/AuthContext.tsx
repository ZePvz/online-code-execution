import { useContext, useState, createContext, useEffect, useRef } from "react";
import React from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export type User = {
    id: string;
    name: string;
    email: string;
};

type AuthContextType = {
    session: Session | null;
    user: any;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Get initial session without redirecting
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);

            if (_event === 'SIGNED_IN' && session && !hasRedirected.current) {
                hasRedirected.current = true;
                // Only redirect if not already on MainPage
                if (!window.location.pathname.startsWith('/MainPage')) {
                    window.location.replace('/MainPage');
                }
            }

            if (_event === 'SIGNED_OUT') {
                hasRedirected.current = false;
                window.location.replace('/Auth/Login');
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) return null;

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return context;
};  