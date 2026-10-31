// frontend/src/pages/Profil.jsx
import { useState } from 'react';
import { User, Lock, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../api/axios';
import { ROLES } from '../utils/constants';

import { Button, Input, Badge } from '../components/ui';

export default function Profil() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    fullname: user?.fullname || '',
    email: user?.email || '',
    province: user?.province || '',
    city: user?.city || '',
    address: user?.address || '',
  });
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '' });
  const [savingP, setSavingP] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingP(true);
    try {
      await authApi.updateMe(profile);
      await refreshUser();
      toast.success('Profil mis à jour');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingP(false);
    }
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (pwd.oldPassword === pwd.newPassword) {
      return toast.error('Le nouveau mot de passe doit être différent');
    }
    setSavingPwd(true);
    try {
      await authApi.changePassword(pwd);
      toast.success('Mot de passe modifié. Reconnectez-vous sur les autres appareils.');
      setPwd({ oldPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  const roleCfg = ROLES[user?.role] || { label: user?.role, color: 'slate' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <User className="text-brand-500" /> Mon profil
        </h1>
        <p className="text-sm text-slate-500">Gérez vos informations personnelles</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center text-2xl font-bold">
            {user?.fullname?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{user?.fullname}</h2>
            <p className="text-sm text-slate-500">{user?.phone}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge color={roleCfg.color}>{roleCfg.label}</Badge>
              {user?.is_active === 1 && <Badge color="emerald">Actif</Badge>}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <h3 className="font-semibold text-slate-800">Informations personnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nom complet" value={profile.fullname}
            onChange={(e) => setProfile({ ...profile, fullname: e.target.value })} />
          <Input label="Email" type="email" value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Input label="Province" value={profile.province}
            onChange={(e) => setProfile({ ...profile, province: e.target.value })} />
          <Input label="Ville" value={profile.city}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Adresse" value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={savingP}>
            <Save size={16} /> Enregistrer
          </Button>
        </div>
      </form>

      <form onSubmit={handleChangePwd} className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Lock size={16} /> Changer le mot de passe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Mot de passe actuel *" type="password" value={pwd.oldPassword}
            onChange={(e) => setPwd({ ...pwd, oldPassword: e.target.value })} required />
          <Input label="Nouveau mot de passe *" type="password" value={pwd.newPassword}
            onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required minLength={6} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck size={12} /> Toutes les sessions seront déconnectées
          </p>
          <Button type="submit" variant="danger" loading={savingPwd}>
            Changer
          </Button>
        </div>
      </form>
    </div>
  );
}