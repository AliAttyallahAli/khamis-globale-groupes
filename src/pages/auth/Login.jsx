// frontend/src/pages/auth/Login.jsx
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Briefcase, Lock, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form);
    setLoading(false);
    if (result.ok) {
      toast.success(`Bienvenue ${result.user.fullname.split(' ')[0]} !`);
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Côté gauche : branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Briefcase size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">KHAMISS</h1>
              <p className="text-sm text-white/70">GLOBAL GROUP</p>
            </div>
          </div>
          <p className="mt-8 text-3xl font-light leading-relaxed">
            Gérez l'ensemble de vos entreprises, boutiques et équipes<br />
            <span className="font-semibold">en un seul endroit.</span>
          </p>
        </div>
        <div className="relative z-10 text-sm text-white/60">
          © {new Date().getFullYear()} KHAMISS GLOBAL GROUP
        </div>
      </div>

      {/* Côté droit : formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">KHAMISS</h1>
              <p className="text-xs text-slate-500">GLOBAL GROUP</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800">Connexion</h2>
          <p className="text-sm text-slate-500 mt-1">
            Accédez à votre espace de gestion
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-[42px] text-slate-400 z-10" />
              <Input
                label="Téléphone"
                type="tel"
                placeholder="Ex: 66000001"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="pl-9"
                required
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-[42px] text-slate-400 z-10" />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-9"
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-brand-500 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>

          <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200">
          </div>
        </div>
      </div>
    </div>
  );
}