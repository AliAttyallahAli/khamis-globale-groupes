// frontend/src/hooks/useRole.js
import { useAuth } from '../context/AuthContext';

export function useRole() {
  const { user } = useAuth();

  return {
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    isGerant: user?.role === 'gerant',
    isAgent: user?.role === 'agent',
    isUser: user?.role === 'user',
    hasRole: (...roles) => user && roles.includes(user.role),
  };
}