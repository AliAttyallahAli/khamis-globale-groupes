// frontend/src/components/guards/RoleGate.jsx
import { useAuth } from '../../context/AuthContext';

export default function RoleGate({ roles = [], children, fallback = null }) {
  const { user } = useAuth();
  if (!user) return fallback;
  if (roles.length === 0) return children;
  return roles.includes(user.role) ? children : fallback;
}