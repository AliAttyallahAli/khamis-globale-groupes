// frontend/src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// ═══════════════════════════════════════════════
// CONTEXTS (chargés d'emblée — critiques)
// ═══════════════════════════════════════════════
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// ═══════════════════════════════════════════════
// LAYOUT & GUARDS (chargés d'emblée)
// ═══════════════════════════════════════════════
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// ═══════════════════════════════════════════════
// PAGES PUBLIQUES — LAZY
// ═══════════════════════════════════════════════
const Login        = lazy(() => import('./pages/auth/Login'));
const Register     = lazy(() => import('./pages/auth/Register'));
const Market       = lazy(() => import('./pages/Market'));

// ═══════════════════════════════════════════════
// PAGES PROTÉGÉES — LAZY
// ═══════════════════════════════════════════════
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const AdminAgents = lazy(() => import('./pages/AdminAgents'));
const AdminAgentDetail = lazy(() => import('./pages/AdminAgentDetail'));
const AdminHelp = lazy(() => import('./pages/AdminHelp'));

// Structure organisationnelle
const Boutiques          = lazy(() => import('./pages/Boutiques'));
const Categories         = lazy(() => import('./pages/Categories'));
const Departements       = lazy(() => import('./pages/Departements'));
const Utilisateurs       = lazy(() => import('./pages/Utilisateurs'));

// Métier
const Produits           = lazy(() => import('./pages/Produits'));
const Commandes          = lazy(() => import('./pages/Commandes'));
const Ventes             = lazy(() => import('./pages/Ventes'));
const Ravitaillements    = lazy(() => import('./pages/Ravitaillements'));

// Personnel & finance
const Personnel          = lazy(() => import('./pages/Personnel'));
const PersonnelDetail    = lazy(() => import('./pages/PersonnelDetail'));
const Paiements          = lazy(() => import('./pages/Paiements'));
const Charges            = lazy(() => import('./pages/Charges'));
const AgentVentes        = lazy(() => import('./pages/AgentVentes'));

// Rapports & paramètres
const Rapports           = lazy(() => import('./pages/Rapports'));
const Parametres         = lazy(() => import('./pages/Parametres'));
const Notifications      = lazy(() => import('./pages/Notifications'));
const Profil             = lazy(() => import('./pages/Profil'));

// AlkherPay
const AlkherPay          = lazy(() => import('./pages/AlkherPay'));

// Aide
const HelpCenter         = lazy(() => import('./pages/HelpCenter'));

// 404
const NotFound           = lazy(() => import('./pages/NotFound'));

// ═══════════════════════════════════════════════
// LOADER GLOBAL
// ═══════════════════════════════════════════════
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-slate-500 font-medium animate-pulse">
        Chargement...
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            {/* ═══════════════════════════════ */}
            {/* Toasts globaux                  */}
            {/* ═══════════════════════════════ */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  fontSize: '14px',
                  borderRadius: '10px',
                  background: '#fff',
                  color: '#1e293b',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                  duration: 5000,
                },
                loading: {
                  iconTheme: { primary: '#1e3a5f', secondary: '#fff' },
                },
              }}
            />

            {/* ═══════════════════════════════ */}
            {/* Suspense : loader global        */}
            {/* ═══════════════════════════════ */}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ═══════════════════════════════ */}
                {/* ROUTES PUBLIQUES                */}
                {/* ═══════════════════════════════ */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/market" element={<Market />} />

                {/* ═══════════════════════════════ */}
                {/* ROUTES PROTÉGÉES (auth requise) */}
                {/* ═══════════════════════════════ */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    {/* Redirection racine → dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* Dashboard (dynamique selon rôle) */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* ───────────────────────────── */}
                    {/* STRUCTURE (admin + gérant)     */}
                    {/* ───────────────────────────── */}
                    <Route element={<ProtectedRoute roles={['admin', 'gerant']} />}>
                      <Route path="/boutiques" element={<Boutiques />} />
                      <Route path="/ravitaillements" element={<Ravitaillements />} />
                      <Route path="/mes-performances" element={<AgentVentes />} />

                    </Route>

                    {/* ───────────────────────────── */}
                    {/* MÉTIER (tous rôles connectés)  */}
                    {/* ───────────────────────────── */}
                    <Route path="/produits" element={<Produits />} />
                    <Route path="/commandes" element={<Commandes />} />
                    <Route path="/ventes" element={<Ventes />} />

                    {/* ───────────────────────────── */}
                    {/* FINANCE (admin + gérant)       */}
                    {/* ───────────────────────────── */}
                    <Route element={<ProtectedRoute roles={['admin', 'gerant']} />}>
                      <Route path="/personnel" element={<Personnel />} />
                      <Route path="/personnel/:id" element={<PersonnelDetail />} />
                      <Route path="/paiements" element={<Paiements />} />
                      <Route path="/charges" element={<Charges />} />
                    </Route>

                    {/* ───────────────────────────── */}
                    {/* ADMIN UNIQUEMENT               */}
                    {/* ───────────────────────────── */}
                    <Route element={<ProtectedRoute roles={['admin']} />}>
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/departements" element={<Departements />} />
                      <Route path="/utilisateurs" element={<Utilisateurs />} />
                      <Route path="/parametres" element={<Parametres />} />
                      <Route path="/admin/agents" element={<AdminAgents />} />
                      <Route path="/admin/agents/:id" element={<AdminAgentDetail />} />
                      <Route path="/admin/help" element={<AdminHelp />} />

                    </Route>

                    {/* ───────────────────────────── */}
                    {/* TRANSVERSAL (tous rôles)       */}
                    {/* ───────────────────────────── */}
                    <Route path="/rapports" element={<Rapports />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profil" element={<Profil />} />
                    <Route path="/aide" element={<HelpCenter />} />

                    {/* ───────────────────────────── */}
                    {/* ALKHERPAY (admin + agent)      */}
                    {/* ───────────────────────────── */}
                    <Route element={<ProtectedRoute roles={['admin', 'agent']} />}>
                      <Route path="/alkherpay" element={<AlkherPay />} />
                    </Route>
                  </Route>
                </Route>

                {/* ═══════════════════════════════ */}
                {/* 404 — page dédiée              */}
                {/* ═══════════════════════════════ */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}