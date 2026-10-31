// frontend/src/components/forms/BoutiqueForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Store, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const EMPTY = {
  name: '',
  category_id: '',
  departement_id: '',
  gerant_id: '',
  address: '',
  phone: '',
};

export default function BoutiqueForm({
  initial = null,
  categories = [],
  departements = [],
  gerants = [],
  onSubmit,
  onCancel,
  loading = false,
  isGerant = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        category_id: initial.category_id || '',
        departement_id: initial.departement_id || '',
        gerant_id: initial.gerant_id || '',
        address: initial.address || '',
        phone: initial.phone || '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [initial]);

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Nom requis';
    if (!form.category_id) errs.category_id = 'Catégorie requise';
    if (form.phone && !/^\d{8}$/.test(form.phone)) {
      errs.phone = 'Téléphone doit contenir 8 chiffres';
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

    onSubmit({
      name: form.name.trim(),
      category_id: parseInt(form.category_id, 10),
      departement_id: form.departement_id ? parseInt(form.departement_id, 10) : null,
      gerant_id: form.gerant_id ? parseInt(form.gerant_id, 10) : null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom de la boutique *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Ex: Boutique Centre-Ville"
        error={errors.name}
        required
        minLength={2}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Catégorie *"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          error={errors.category_id}
          required
        >
          <option value="">— Sélectionner —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

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
          label="Gérant"
          value={form.gerant_id}
          onChange={(e) => setForm({ ...form, gerant_id: e.target.value })}
          disabled={isGerant}
        >
          <option value="">— Aucun —</option>
          {gerants.map((g) => (
            <option key={g.id} value={g.id}>
              {g.fullname}{g.phone ? ` (${g.phone})` : ''}
            </option>
          ))}
        </Select>

        <Input
          label="Téléphone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 8) })}
          placeholder="8 chiffres"
          error={errors.phone}
          maxLength={8}
        />
      </div>

      <Input
        label="Adresse"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        placeholder="Ex: Avenue Charles de Gaulle, N'Djamena"
      />

      {isGerant && initial && (
        <div className="alert-info text-xs">
          <Store size={14} />
          <span>Vous ne pouvez pas modifier le gérant assigné.</span>
        </div>
      )}

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