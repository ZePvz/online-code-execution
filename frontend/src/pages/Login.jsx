import { useState,useEffect } from "react";
import { supabase } from "src/utils/supabase";
import { useNavigate,Link } from "react-router-dom";
function Login(){
    const navigate = useNavigate();

    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(false);
    return(
        <>
        <div>
            <form action="">
                <h1></h1>
                <p></p>
                <button></button>
                <button></button>
            </form>
            {error && <p>{error}</p>}
        </div>
        <input type="text" />
        <input type="text" />
        <button></button>
        <Link></Link>
        </>
    );
}

export default Login;