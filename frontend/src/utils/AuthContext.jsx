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
        
    })
}