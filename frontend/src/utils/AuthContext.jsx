import { createContext, useContext , useState, useEffect } from 'react';
import { supabase } from './supabase';


const AuthContext = createContext(null);

export function AuthProvider({ children }){
    const [user,setUser] = useState(null);
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
        supabase.auth.getSession().then(({data : { session }})=>{
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: listner } = supabase.auth.onAuthStateChange((_event,session)=>{
        setUser(session?.user ?? null);
        });

        return () => {
            listner.subscription.unsubscribe();
        }
        
    },[]);

    const logout = async () => {
        await supabase.auth.signOut();
    }

    const value = { user, loading, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    return useContext(AuthContext);
}