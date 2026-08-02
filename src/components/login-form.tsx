import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from '@/components/auth/auth-shell';
import { LockKeyhole, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const rememberedEmail = localStorage.getItem('rememberedEmail') || '';
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [rememberedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(email, password);
      const { token, fullName, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('userRole', role);

      if (rememberMe && email.trim()) {
        localStorage.setItem('rememberedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage inventory, oversee orders, and keep café operations moving from a single workspace."
    >
      <div className="space-y-7">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email Address
            </label>
            <div className="relative rounded-2xl border border-border/70 bg-background shadow-sm transition-all focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-200/60 dark:focus-within:border-amber-500/40 dark:focus-within:ring-amber-500/20">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@streetpos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative rounded-2xl border border-border/70 bg-background shadow-sm transition-all focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-200/60 dark:focus-within:border-amber-500/40 dark:focus-within:ring-amber-500/20">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-0 bg-transparent pl-10 pr-12 shadow-none focus-visible:ring-0"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-amber-600 focus:ring-amber-500"
              />
              Remember me on this device
            </label>
            <p className="text-xs text-muted-foreground">
              Saves only your email for faster sign-in.
            </p>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-2xl text-base shadow-lg shadow-amber-500/20 transition-transform hover:-translate-y-0.5"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-muted/30 to-background p-4 text-sm text-muted-foreground shadow-sm">
          Use your assigned staff credentials to access the correct role-based workspace.
        </div>
      </div>
    </AuthShell>
  );
}