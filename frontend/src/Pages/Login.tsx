import { useEffect, useState } from "react";
import { Goto } from "../utils/Navigation";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { useAuth } from "../utils/AuthContext";
import { supabase } from "../utils/supabase";

function Login() {

    const signup = "Auth/signup";
    const navigate = useNavigate();

    const { session } = useAuth();
    const [Email, setEmail] = useState<string>("")
    const [Password, setPassword] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)

    const handleSubmit = async(e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: Email,
                password: Password
            });

            if(signInError){
                setError(signInError.message);
                setLoading(false);
                return;
            }

            // Navigate to dashboard on success (useEffect handles this)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            setLoading(false);
        }
    }
    const GoogleSignIn = async function (e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await supabase.auth.signInWithOAuth({
                provider: "google",
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Google sign in failed";
            setError(message);
            setLoading(false);
        }
    }

    const GithubSignIn = async function (e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await supabase.auth.signInWithOAuth({
                provider: "github",
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "GitHub sign in failed";
            setError(message);
            setLoading(false);
        }
    }
    useEffect(() => {
        if (session) {
            navigate("/MainPage/dashboard"); // change route if needed
        }   
    }, [session]);
    
    return (
        <>
            <div className="MainCard">
                <form onSubmit={handleSubmit} className="AuthFormLogin">
                    <h1 className="Heading_1">Code Sphere</h1>
                    <h1 className="Heading_2">Welcome Back</h1>
                    <p className="text">Sign into your account to continue coding</p>
                    <button 
                        type="button" 
                        onClick={GoogleSignIn} 
                        className="GoogleSignInButton"
                        disabled={loading}
                    >
                        Continue with Google
                    </button>
                    <button 
                        type="button" 
                        onClick={GithubSignIn} 
                        className="GithubSignInButton"
                        disabled={loading}
                    >
                        Continue with github
                    </button>
                    <p className="text">or sign in with</p>
                    {error && <p className="ErrorText">{error}</p>}
                    <input 
                        type="email" 
                        placeholder="Enter Email" 
                        className="input" 
                        value={Email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Enter Password" 
                        className="input" 
                        value={Password} 
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <button type="submit" className="Button" disabled={loading}>
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                    <p onClick={() => Goto(navigate, signup)} className="text"> Don't have an Account ?</p>
                </form>
            </div>
        </>
    )
}
export default Login;