import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

      localStorage.setItem('token', token);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('userRole', role);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900 p-4">
      <div className="w-full max-w-[960px] grid md:grid-cols-2 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden">
        {/* Form Side */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-4xl">☕</div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter">StreetPOS</h1>
              <p className="text-sm text-amber-600">Café Operations</p>
            </div>
          </div>

          <h2 className="text-3xl font-semibold mb-2">Welcome back</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">Sign in to manage your café</p>

          {error && <div className="mb-6 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-2">Email Address</label>
              <Input 
                type="email" 
                placeholder="admin@streetpos.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Visual Side */}
        <div className="hidden md:flex bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 items-center justify-center relative overflow-hidden">
          <div className="text-white text-center z-10">
            <div className="text-7xl mb-6">☕</div>
            <h3 className="text-4xl font-bold tracking-tight mb-3">Run your café</h3>
            <p className="max-w-xs mx-auto opacity-90">Efficiently. Beautifully. Profitably.</p>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
      </div>
    </div>
  );
}