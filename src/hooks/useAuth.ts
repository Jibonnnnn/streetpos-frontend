import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fullName = localStorage.getItem('fullName') || '';
    const role = localStorage.getItem('userRole') || '';
    if (fullName && role) {
      setUser({ fullName, role });
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return { user, logout, isAuthenticated: !!user };
}