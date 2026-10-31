// frontend/src/components/layout/Topbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, Bell, LogOut, User as UserIcon, HelpCircle,
  Settings, Wallet, Shield, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useRole } from '../../hooks/useRole';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ROLES } from '../../utils/constants';
import Badge from '../ui/Badge';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { isAdmin, isGerant, isAgent } = useRole();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside(() => setMenuOpen(false));

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnecté');
      navigate('/login');
    } catch (err) {
      toast.error('Erreur de déconnexion');
    }
  };

  const roleCfg = ROLES[user?.role] || { label: user?.role, color: 'slate' };
  const firstName = user?.fullname?.split(' ')[0] || '';
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center justify-between shadow-sm">
      {/* ───────────────────────────────────── */}
      {/* GAUCHE : Menu mobile + Salutation     */}
      {/* ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
          aria-label="Menu"
        >
          <Menu size={20} className="text-slate-600" />
        </button>

        <div className="hidden lg:block">
          <h1 className="text-sm font-semibold text-slate-800 leading-tight">
            Bienvenue, {firstName} 👋
          </h1>
          <p className="text-xs text-slate-500 capitalize">{today}</p>
        </div>
      </div>

      {/* ───────────────────────────────────── */}
      {/* DROITE : Actions                      */}
      {/* ───────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Bouton aide rapide */}
        <Link
          to="/aide"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-brand-500 transition-colors"
          title="Centre d'aide"
          aria-label="Aide"
        >
          <HelpCircle size={20} />
        </Link>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-brand-500 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Menu utilisateur */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Menu utilisateur"
          >
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.fullname?.[0]?.toUpperCase() || '?'}
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 hidden lg:block transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-fade-in">
              {/* Header du dropdown */}
              <div className="px-3 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user?.fullname?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {user?.fullname}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.phone}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge color={roleCfg.color}>
                    <Shield size={10} /> {roleCfg.label}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <Link
                  to="/profil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserIcon size={16} className="text-slate-400" />
                  Mon profil
                </Link>

                <Link
                  to="/aide"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <HelpCircle size={16} className="text-slate-400" />
                  Centre d'aide
                </Link>

                {(isAdmin || isAgent) && (
                  <Link
                    to="/alkherpay"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Wallet size={16} className="text-slate-400" />
                    Portail AlkherPay
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/parametres"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={16} className="text-slate-400" />
                    Paramètres
                  </Link>
                )}
              </div>

              {/* Déconnexion */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}