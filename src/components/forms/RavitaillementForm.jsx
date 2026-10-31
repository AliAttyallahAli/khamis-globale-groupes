// frontend/src/components/forms/RavitaillementForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Truck, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const EMPTY = {
  boutique_id: '',
  produit_id: '',
  quantite_demandee: '',
  notes: '',
};

export default function RavitaillementForm({
  boutiques = [],
  produits = [],
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(EMPTY);
    setErrors({});
  }, []);

  // Filtrer les produits par boutique
  const produitsFiltres = form.boutique_id
    ? produits.filter((p) => p.boutique_id === parseInt(form.boutique_id, 10))
    : produits;

  const validate = () => {
    const errs = {};
    if (!form.boutique_id) errs.boutique_id = 'Boutique requise';
    if (!form.produit_id) errs.produit_id = 'Produit requis';
    if (!form.quantite_demandee || parseInt(form.quantite_demandee, 10) < 1) {
      errs.quantite_demandee = 'Quantité ≥ 1 requise';
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
      boutique_id: parseInt(form.boutique_id, 10),
      produit_id: parseInt(form.produit_id, 10),
      quantite_demandee: parseInt(form.quantite_demandee, 10),
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Boutique *"
        value={form.boutique_id}
        onChange={(e) => setForm({ ...form, boutique_id: e.target.value, produit_id: '' })}
        error={errors.boutique_id}
        required
      >
        <option value="">— Sélectionner —</option>
        {boutiques.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </Select>

      <Select
        label="Produit *"
        value={form.produit_id}
        onChange={(e) => setForm({ ...form, produit_id: e.target.value })}
        error={errors.produit_id}
        required
        disabled={!form.boutique_id}
      >
        <option value="">— Sélectionner —</option>
        {produitsFiltres.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} (Stock: {p.stock})
          </option>
        ))}
      </Select>

      <Input
        label="Quantité demandée *"
        type="number"
        min={1}
        value={form.quantite_demandee}
        onChange={(e) => setForm({ ...form, quantite_demandee: e.target.value })}
        error={errors.quantite_demandee}
        required
        placeholder="Ex: 50"
      />

      <div>
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          maxLength={500}
          placeholder="Ex: Stock critique, commander en urgence"
          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X size={16} /> Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          <Truck size={16} /> Envoyer la demande
        </Button>
      </div>
    </form>
  );
}