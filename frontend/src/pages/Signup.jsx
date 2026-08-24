import { useState } from 'react';
import { Link} from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from  '@/components/ui/input';
import { Label } from '@/components/ui/label';


function Signup(){
    

    const [email , setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error,setError] = useState('');
    const [loading,setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const {error : signUpError} = await supabase.auth.signUp({
            email,
            password
        });

        if(signUpError){
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        setMessage('Account created! Check your email to confirm, then log in.');
        setLoading(false);
    }
    return(
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border p-6"
      >
        <h1 className="text-2xl font-semibold text-center">CodeSphere</h1>
        <p className="text-sm text-muted-foreground text-center">
          Create an account to start coding
        </p>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        {message && <p className="text-sm text-center text-green-600">{message}</p>}

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>

        <Link to="/login" className="text-sm text-center text-muted-foreground hover:underline">
          Already have an account?
        </Link>
      </form>
    </div>
  );
}

export default Signup;