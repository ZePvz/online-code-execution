import { useState,useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate,Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { Input } from  '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from "../utils/AuthContext";

function Login(){
    const navigate = useNavigate();
    const {user , loading:authLoading} = useAuth();

    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(false);

    //email sign in
    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError("");
        setLoading(true);

        const {error : signInError} = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if(signInError){
            setError(signInError.message);
            setLoading(false);
            return;
        }
        navigate('/');
    }

    //google sign in
    const handleGoogleSignIn = async () =>{
        setLoading(true);
        setError('');
        await supabase.auth.signInWithOAuth({provider: 'google'});
    };

    //github sign in
    const handleGithubSignIn = async () =>{
        setLoading(true);
        setError('');
        await supabase.auth.signInWithOAuth({provider: 'github'});
    };

    useEffect(()=>{
        if(!authLoading && user){
          navigate("/")
        }
    },[authLoading,user]);

    return(
        <>
        <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border p-6"
      >
        <h1 className="text-2xl font-semibold text-center">CodeSphere</h1>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to continue coding
        </p>

        <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={loading}>
          Continue with Google
        </Button>
        <Button type="button" variant="outline" onClick={handleGithubSignIn} disabled={loading}>
          Continue with GitHub
        </Button>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </Button>

        <Link to="/signup" className="text-sm text-center text-muted-foreground hover:underline">
          Don't have an account?
        </Link>
      </form>
    </div>
        </>
    );
}

export default Login;