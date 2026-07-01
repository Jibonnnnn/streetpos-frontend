import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, fullName, role } = response.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('userRole', role);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-[900px] shadow-sm overflow-hidden">
        <CardContent className="grid md:grid-cols-2 p-0">
          {/* Left Side - Form */}
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-muted-foreground mt-2">Login to your StreetPOS account</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="admin@streetpos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-black/90" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Right Side - Visual */}
          <div className="hidden md:block bg-zinc-100 relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 rounded-full bg-white shadow flex items-center justify-center mb-8">
                <span className="text-5xl">☕</span>
              </div>
              <p className="text-center text-sm text-muted-foreground max-w-[260px]">
                By logging in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}