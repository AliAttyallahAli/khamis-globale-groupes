// frontend/src/hooks/useAuth.js
// Alias réutilisable du context AuthContext
import { useAuth as useAuthContext } from '../context/AuthContext';

export function useAuth() {
  return useAuthContext();
}

// Helper : vérifier un rôle rapidement
export function useHasRole(...roles) {
  const { user } = useAuthContext();
  return user && roles.includes(user.role);
}

// Helper : vérifier une permission
export function useCanAccess(resource, action) {
  const { user } = useAuthContext();
  if (!user) return false;
  if (user.role === 'admin') return true;

  const PERMISSIONS = {
    gerant: {
      produits: ['read', 'update'],
      commandes: ['read', 'update'],
      ventes: ['read', 'update'],
      personnel: ['create', 'read', 'update'],
      paiements: ['create', 'read'],
      ravitaillements: ['create', 'read', 'update'],
      charges: ['create', 'read'],
      rapports: ['read', 'export'],
    },
    agent: {
      produits: ['read'],
      commandes: ['create', 'read'],
      ventes: ['create', 'read'],
      rapports: ['read', 'export'],
    },
    user: {
      produits: ['read'],
      boutiques: ['read'],
    },
  };

  const rolePerms = PERMISSIONS[user.role];
  if (!rolePerms) return false;
  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;
  return resourcePerms.includes(action);
}