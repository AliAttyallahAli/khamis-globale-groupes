// frontend/src/components/layout/Sidebar.jsx
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Tags, Building2, Users, UserCog,
  Package, ShoppingCart, Receipt, Truck, Wallet, FileBarChart2,
  Settings, X, CreditCard, Bell, LogOut, Briefcase, Home,
  HelpCircle, BarChart3, UserCircle2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';

// ═══════════════════════════════════════════════
// MENU STRUCTURÉ
// ═══════════════════════════════════════════════
const MENU_GROUPS = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      {
        to: '/dashboard',
        label: 'Tableau de bord',
        icon: LayoutDashboard,
        roles: ['admin', 'gerant', 'agent', 'user'],
      },
      {
        to: '/market',
        label: 'Market',
        icon: Home,
        roles: ['admin', 'gerant', 'agent', 'user'],
        badge: 'NEW',
      },
    ],
  },
  {
    id: 'metier',
    label: 'Gestion',
    items: [
      {
        to: '/produits',
        label: 'Produits',
        icon: Package,
        roles: ['admin', 'gerant', 'agent'],
      },
      {
        to: '/commandes',
        label: 'Commandes',
        icon: ShoppingCart,
        roles: ['admin', 'gerant', 'agent'],
        badge: 'pending',
      },
      {
        to: '/ventes',
        label: 'Ventes',
        icon: Receipt,
        roles: ['admin', 'gerant', 'agent'],
      },
      // Mes performances (agent + admin)
      {
        to: '/mes-performances',
        label: 'Mes performances',
        icon: BarChart3,
        roles: ['agent', 'admin'],
      },
      {
        to: '/ravitaillements',
        label: 'Ravitaillements',
        icon: Truck,
        roles: ['admin', 'gerant'],
      },
    ],
  },
  {
    id: 'structure',
    label: 'Organisation',
    items: [
      {
        to: '/boutiques',
        label: 'Boutiques',
        icon: Store,
        roles: ['admin', 'gerant'],
      },
      {
        to: '/categories',
        label: 'Catégories',
        icon: Tags,
        roles: ['admin'],
      },
      {
        to: '/departements',
        label: 'Départements',
        icon: Building2,
        roles: ['admin'],
      },
      {
        to: '/utilisateurs',
        label: 'Utilisateurs',
        icon: Users,
        roles: ['admin'],
      },
      // ✅ NOUVEAU : Agents (admin uniquement)
      {
        to: '/admin/agents',
        label: 'Agents',
        icon: UserCircle2,
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Personnel & Finance',
    items: [
      {
        to: '/personnel',
        label: 'Personnel',
        icon: UserCog,
        roles: ['admin', 'gerant'],
      },
      {
        to: '/paiements',
        label: 'Paiements',
        icon: Wallet,
        roles: ['admin', 'gerant'],
      },
      {
        to: '/charges',
        label: 'Charges',
        icon: CreditCard,
        roles: ['admin', 'gerant'],
      },
      {
        to: '/alkherpay',
        label: 'AlkherPay',
        icon: Wallet,
        roles: ['admin', 'agent'],
      },
    ],
  },
  {
    id: 'other',
    label: 'Autres',
    items: [
      {
        to: '/rapports',
        label: 'Rapports',
        icon: FileBarChart2,
        roles: ['admin', 'gerant', 'agent'],
      },
      {
        to: '/notifications',
        label: 'Notifications',
        icon: Bell,
        roles: ['admin', 'gerant', 'agent', 'user'],
        badge: 'notif',
      },
      {
        to: '/aide',
        label: 'Aide',
        icon: HelpCircle,
        roles: ['admin', 'gerant', 'agent', 'user'],
      },
      {
        to: '/parametres',
        label: 'Paramètres',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
];

// ═══════════════════════════════════════════════
// PREFETCH MAP
// ═══════════════════════════════════════════════
const PREFETCH_MAP = {
  '/dashboard':         () => import('../../pages/Dashboard'),
  '/market':            () => import('../../pages/Market'),
  '/produits':          () => import('../../pages/Produits'),
  '/commandes':         () => import('../../pages/Commandes'),
  '/ventes':            () => import('../../pages/Ventes'),
  '/mes-performances':  () => import('../../pages/AgentVentes'),
  '/ravitaillements':   () => import('../../pages/Ravitaillements'),
  '/boutiques':         () => import('../../pages/Boutiques'),
  '/categories':        () => import('../../pages/Categories'),
  '/departements':      () => import('../../pages/Departements'),
  '/utilisateurs':      () => import('../../pages/Utilisateurs'),
  '/admin/agents':      () => import('../../pages/AdminAgents'),       // ✅ ajouté
  '/personnel':         () => import('../../pages/Personnel'),
  '/paiements':         () => import('../../pages/Paiements'),
  '/charges':           () => import('../../pages/Charges'),
  '/alkherpay':         () => import('../../pages/AlkherPay'),
  '/rapports':          () => import('../../pages/Rapports'),
  '/notifications':     () => import('../../pages/Notifications'),
  '/aide':              () => import('../../pages/HelpCenter'),
  '/parametres':        () => import('../../pages/Parametres'),
  '/profil':            () => import('../../pages/Profil'),
};

const prefetchedPaths = new Set();

function prefetchPage(path) {
  if (prefetchedPaths.has(path)) return;
  const loader = PREFETCH_MAP[path];
  if (!loader) return;
  prefetchedPaths.add(path);
  loader().catch(() => {
    prefetchedPaths.delete(path);
  });
}

// ═══════════════════════════════════════════════
// SIDEBAR LINK
// ═══════════════════════════════════════════════
function SidebarLink({ item, onClick, badges }) {
  const Icon = item.icon;

  let badgeContent = null;
  let badgeColor = '';
  if (item.badge === 'NEW') {
    badgeContent = 'NEW';
    badgeColor = 'bg-accent-500 text-white';
  } else if (item.badge === 'pending' && badges.pendingCommandes > 0) {
    badgeContent = badges.pendingCommandes;
    badgeColor = 'bg-amber-500 text-white';
  } else if (item.badge === 'notif' && badges.unreadNotifs > 0) {
    badgeContent = badges.unreadNotifs > 99 ? '99+' : badges.unreadNotifs;
    badgeColor = 'bg-red-500 text-white';
  }

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      onMouseEnter={() => prefetchPage(item.to)}
      onFocus={() => prefetchPage(item.to)}
      onTouchStart={() => prefetchPage(item.to)}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
         ${isActive
           ? 'bg-white/15 text-white font-medium'
           : 'text-white/70 hover:bg-white/5 hover:text-white'}`
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {badgeContent && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${badgeColor}`}
        >
          {badgeContent}
        </span>
      )}
    </NavLink>
  );
}

// ═══════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════
export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [pendingCommandes, setPendingCommandes] = useState(0);

  // Badge commandes en attente (gérant uniquement)
  useEffect(() => {
    if (!user || user.role !== 'gerant') return;

    const fetchPending = async () => {
      try {
        const api = (await import('../../api/axios')).default;
        const res = await api.get('/commandes', {
          params: { statut: 'en_attente', limit: 1 },
        });
        setPendingCommandes(res.data.pagination?.total || 0);
      } catch {
        // silencieux
      }
    };

    fetchPending();

    if (socket) {
      const handler = () => fetchPending();
      socket.on('notification', handler);
      return () => socket.off('notification', handler);
    }
  }, [user, socket]);

  // Filtrer selon rôle
  const allowedGroups = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(user?.role)),
  })).filter((group) => group.items.length > 0);

  const badges = {
    pendingCommandes,
    unreadNotifs: unreadCount || 0,
  };

  const handleLogout = async () => {
    if (!confirm('Se déconnecter ?')) return;
    await logout();
    navigate('/login');
  };

  // Prefetch initial
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchPage('/dashboard');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-brand-900 text-white
                    flex flex-col transition-transform duration-300 ease-out
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Briefcase size={18} />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm">KHAMIS</div>
              <div className="text-[10px] text-white/60">GLOBALE GROUPES</div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {allowedGroups.map((group) => (
            <div key={group.id}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    onClick={onClose}
                    badges={badges}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* FOOTER USER */}
        <div className="p-3 border-t border-white/10 flex-shrink-0 space-y-2">
          <Link
            to="/profil"
            onClick={onClose}
            onMouseEnter={() => prefetchPage('/profil')}
            onFocus={() => prefetchPage('/profil')}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.fullname?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate group-hover:text-white transition-colors">
                {user?.fullname}
              </p>
              <p className="text-[10px] text-white/60 capitalize">{user?.role}</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                       text-white/60 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}