// frontend/src/components/forms/UtilisateurForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, Save, X, Key } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { ROLES } from '../../utils/constants';

const EMPTY = {
  fullname: '',
  phone: '',
  email: '',
  password: '',
  role: 'user',
  province: '',
  city: '',
  address: '',
};

export default function UtilisateurForm({
  initial = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const isEditing = !!initial;

  useEffect(() => {
    if (initial) {
      setForm({
        fullname: initial.fullname || '',
        phone: initial.phone || '',
        email: initial.email || '',
        password: '',
        role: initial.role || 'user',
        province: initial.province || '',
        city: initial.city || '',
        address: initial.address || '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [initial]);

  const validate = () => {
    const errs = {};

    // Nom complet
    if (!form.fullname || form.fullname.trim().length < 3) {
      errs.fullname = 'Nom complet requis (3 caractères minimum)';
    }

    // Téléphone (obligatoire uniquement en création)
    if (!isEditing) {
      if (!form.phone || !/^\d{8}$/.test(form.phone)) {
        errs.phone = 'Téléphone requis (8 chiffres)';
      }
      if (!form.password || form.password.length < 6) {
        errs.password = 'Mot de passe requis (6 caractères minimum)';
      }
    }

    // Email
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email invalide';
    }

    // Rôle
    if (!form.role || !ROLES[form.role]) {
      errs.role = 'Rôle valide requis';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Corrigez les erreurs du formulaire');
      return;
    }

    const payload = {
      fullname: form.fullname.trim(),
      email: form.email.trim() || null,
      role: form.role,
      province: form.province.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
    };

    if (!isEditing) {
      payload.phone = form.phone.trim();
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nom complet *"
          value={form.fullname}
          onChange={(e) => setForm({ ...form, fullname: e.target.value })}
          error={errors.fullname}
          required
          minLength={3}
          maxLength={100}
          placeholder="Ex: Jean Dupont"
        />

        <Input
          label={`Téléphone ${!isEditing ? '*' : ''}`}
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 8) })
          }
          error={errors.phone}
          disabled={isEditing}
          maxLength={8}
          placeholder="8 chiffres"
          help={isEditing ? 'Non modifiable' : undefined}
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          placeholder="email@exemple.com"
        />

        <Select
          label="Rôle *"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          error={errors.role}
          required
        >
          {Object.entries(ROLES).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </Select>

        {!isEditing && (
          <div className="md:col-span-2">
            <Input
              label="Mot de passe *"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              required
              minLength={6}
              placeholder="••••••••"
              help="Minimum 6 caractères"
            />
          </div>
        )}

        <Input
          label="Province"
          value={form.province}
          onChange={(e) => setForm({ ...form, province: e.target.value })}
          placeholder="Ex: N'Djamena"
        />

        <Input
          label="Ville"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="Ex: N'Djamena"
        />

        <div className="md:col-span-2">
          <Input
            label="Adresse"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ex: Avenue Charles de Gaulle"
          />
        </div>
      </div>

      {isEditing && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <Key size={14} />
            <span className="font-medium">Mot de passe non modifiable ici</span>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Utilisez l'action "Réinitialiser le mot de passe" depuis la liste des utilisateurs.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            <X size={16} /> Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          <Save size={16} /> {isEditing ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}