import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('accessToken', response.data.token);
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    setUser(response.data.user);
    return response;
  };

  const refreshToken = async () => {
    const refreshTokenStr = localStorage.getItem('refreshToken');
    if (!refreshTokenStr) return null;

    try {
      // Cast authService to any to bypass missing refreshToken type definition
      const res = await (authService as any).refreshToken({ refreshToken: refreshTokenStr });
      localStorage.setItem('accessToken', res.data.token);
      return res.data.token;
    } catch (error) {
      logout();
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  useEffect(() => {
    // Optional: Check for existing token on mount
    setLoading(false);
  }, []);

  return { user, login, logout, refreshToken, loading };
};