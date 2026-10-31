// frontend/src/pages/auth/Register.jsx
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    password: '',
    email: '',
    province: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.ok) {
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">KHAMISS</h1>
            <p className="text-xs text-slate-500">GLOBAL GROUP</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800">Créer un compte</h2>
        <p className="text-sm text-slate-500 mt-1">
          Inscription rapide pour consulter les produits
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Nom complet"
            placeholder="Ex: Jean Dupont"
            value={form.fullname}
            onChange={(e) => setForm({ ...form, fullname: e.target.value })}
            required
            minLength={3}
          />
          <Input
            label="Téléphone (8 chiffres)"
            type="tel"
            placeholder="Ex: 66000001"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            pattern="\d{8}"
            title="8 chiffres"
            required
          />
          <Input
            label="Email (optionnel)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Province"
            placeholder="Ex: N'Djamena"
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
          />
          <Input
            label="Ville"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Input
            label="Mot de passe (min 6 caractères)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Créer mon compte
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-brand-500 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}