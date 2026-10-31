// frontend/src/components/forms/PersonnelForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserCog, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const EMPTY = {
  fullname: '',
  phone: '',
  email: '',
  poste: '',
  departement_id: '',
  boutique_id: '',
  type_contrat: 'CDI',
  date_embauche: new Date().toISOString().slice(0, 10),
  salaire_base: 0,
  statut: 'actif',
};

export default function PersonnelForm({
  initial = null,
  departements = [],
  boutiques = [],
  onSubmit,
  onCancel,
  loading = false,
  isAdmin = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        fullname: initial.fullname || '',
        phone: initial.phone || '',
        email: initial.email || '',
        poste: initial.poste || '',
        departement_id: initial.departement_id || '',
        boutique_id: initial.boutique_id || '',
        type_contrat: initial.type_contrat || 'CDI',
        date_embauche: initial.date_embauche || EMPTY.date_embauche,
        salaire_base: initial.salaire_base || 0,
        statut: initial.statut || 'actif',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [initial]);

  const validate = () => {
    const errs = {};
    if (!form.fullname || form.fullname.trim().length < 3) {
      errs.fullname = 'Nom complet requis (3 car. min)';
    }
    if (form.phone && !/^\d{8}$/.test(form.phone)) {
      errs.phone = 'Téléphone doit contenir 8 chiffres';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email invalide';
    }
    if (!form.poste || form.poste.trim().length < 2) {
      errs.poste = 'Poste requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Corrigez les erreurs');
      return;
    }

    const payload = {
      fullname: form.fullname.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      poste: form.poste.trim(),
      departement_id: form.departement_id ? parseInt(form.departement_id, 10) : null,
      boutique_id: form.boutique_id ? parseInt(form.boutique_id, 10) : null,
      type_contrat: form.type_contrat,
      date_embauche: form.date_embauche,
      statut: form.statut,
    };
    // Seul admin peut modifier le salaire
    if (isAdmin) {
      payload.salaire_base = parseInt(form.salaire_base, 10) || 0;
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
          placeholder="Ex: Hassan Vendeur"
          error={errors.fullname}
          required
        />
        <Input
          label="Téléphone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 8) })}
          placeholder="8 chiffres"
          error={errors.phone}
          maxLength={8}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@exemple.com"
          error={errors.email}
        />
        <Input
          label="Poste *"
          value={form.poste}
          onChange={(e) => setForm({ ...form, poste: e.target.value })}
          placeholder="Ex: Vendeur, Caissier..."
          error={errors.poste}
          required
        />
        <Select
          label="Département"
          value={form.departement_id}
          onChange={(e) => setForm({ ...form, departement_id: e.target.value })}
        >
          <option value="">— Aucun —</option>
          {departements.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <Select
          label="Boutique"
          value={form.boutique_id}
          onChange={(e) => setForm({ ...form, boutique_id: e.target.value })}
        >
          <option value="">— Aucune —</option>
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select
          label="Type de contrat"
          value={form.type_contrat}
          onChange={(e) => setForm({ ...form, type_contrat: e.target.value })}
        >
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="stage">Stage</option>
          <option value="freelance">Freelance</option>
        </Select>
        <Input
          label="Date d'embauche"
          type="date"
          value={form.date_embauche}
          onChange={(e) => setForm({ ...form, date_embauche: e.target.value })}
        />
        {isAdmin && (
          <Input
            label="Salaire de base (FCFA)"
            type="number"
            min={0}
            value={form.salaire_base}
            onChange={(e) => setForm({ ...form, salaire_base: e.target.value })}
          />
        )}
        {initial && (
          <Select
            label="Statut"
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value })}
          >
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="sorti">Sorti</option>
          </Select>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X size={16} /> Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          <Save size={16} /> {initial ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}