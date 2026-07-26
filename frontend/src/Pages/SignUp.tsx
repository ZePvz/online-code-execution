import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignUp.css";
import { Goto } from "../utils/Navigation";
import { supabase } from "../utils/supabase";


function SignUp() {

    const navigate = useNavigate();

    const LoginPage = "Auth/login"
    const [name, setName]               = useState<string>("");
    const [username, setUsername]       = useState<string>("");
    const [email, setEmail]             = useState<string>("");
    const [password, setPassword]       = useState<string>("");
    const [confirm, setConfirm]         = useState<string>("");
    const [error, setError]             = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<string>("");

    const SignUpReq = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Validate passwords match
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // Sign up user with Supabase, storing user metadata
            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        username,
                    }
                }
            });

            if (signupError) {
                setError(signupError.message);
                setLoading(false);
                return;
            }

            // Check if email confirmation is required
            if (data.user && !data.session) {
                setSuccess("Account created! Check your email to verify your account.");
                setEmail("");
                setPassword("");
                setConfirm("");
                setName("");
                setUsername("");
                setTimeout(() => navigate("/Auth/login"), 3000);
            } else if (data.session) {
                setSuccess("Account created successfully! Redirecting...");
                setTimeout(() => navigate("/MainPage/DashBoard"), 2000);
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const GoogleSignUp = async () => {
        setLoading(true);
        try {
            await supabase.auth.signInWithOAuth({
                provider: "google",
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Google sign up failed";
            setError(message);
            setLoading(false);
        }
    };

    const GithubSignUp = async () => {
        setLoading(true);
        try {
            await supabase.auth.signInWithOAuth({
                provider: "github",
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "GitHub sign up failed";
            setError(message);
            setLoading(false);
        }
    };
    return (
        <div className="MainCard">
            <form onSubmit={SignUpReq} className="AuthFormSignup">

                <h1 className="Heading_1">Code Sphere</h1>
                <h2 className="Heading_2">Create an account</h2>
                <p className="text">Join CodeSphere and start coding today</p>


                <input
                    type="text"
                    className="input"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    disabled={loading}
                />
                <input
                    type="text"
                    className="input"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                />
                <input
                    type="email"                         
                    className="input"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                />
                <input
                    type="password"                       
                    className="input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                />
                <input
                    type="password"                       
                    className="input"
                    placeholder="Confirm Password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                />

                {error && <p className="ErrorText">{error}</p>}
                {success && <p style={{ color: '#4ade80' }}>{success}</p>}

                <button type="submit" className="Button" disabled={loading}>   
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <button 
                    type="button" 
                    onClick={GoogleSignUp} 
                    className="GoogleSignInButton"
                    disabled={loading}
                >
                    Continue with Google
                </button>
                <button 
                    type="button" 
                    onClick={GithubSignUp} 
                    className="GithubSignInButton"
                    disabled={loading}
                >
                    Continue with github
                </button>

                <p className="text" onClick={()=>Goto(navigate,LoginPage)}>
                    Already have an account? Sign in
                </p>

            </form>
        </div>
    );
}

export default SignUp;