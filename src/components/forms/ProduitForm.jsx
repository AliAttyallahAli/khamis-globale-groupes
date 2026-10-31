// frontend/src/components/forms/ProduitForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Package, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const EMPTY = {
  name: '',
  reference: '',
  description: '',
  image: '',
  category_id: '',
  boutique_id: '',
  prix_partenaire: '',
  prix_vente: '',
  stock: 0,
  seuil_alerte: 10,
};

export default function ProduitForm({
  initial = null,
  categories = [],
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
        name: initial.name || '',
        reference: initial.reference || '',
        description: initial.description || '',
        image: initial.image || '',
        category_id: initial.category_id || '',
        boutique_id: initial.boutique_id || '',
        prix_partenaire: initial.prix_partenaire ?? '',
        prix_vente: initial.prix_vente ?? '',
        stock: initial.stock ?? 0,
        seuil_alerte: initial.seuil_alerte ?? 10,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [initial]);

  const marge =
    form.prix_partenaire !== '' && form.prix_vente !== ''
      ? parseInt(form.prix_vente, 10) - parseInt(form.prix_partenaire, 10)
      : null;

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) {
      errs.name = 'Nom requis (2 caractères min.)';
    }
    if (!form.category_id) errs.category_id = 'Catégorie requise';
    if (!form.boutique_id) errs.boutique_id = 'Boutique requise';

    const pp = parseInt(form.prix_partenaire, 10);
    const pv = parseInt(form.prix_vente, 10);

    if (isNaN(pp) || pp < 0) errs.prix_partenaire = 'Prix partenaire valide requis';
    if (isNaN(pv) || pv < 0) errs.prix_vente = 'Prix de vente valide requis';
    if (!isNaN(pp) && !isNaN(pv) && pv < pp) {
      errs.prix_vente = 'Le prix de vente doit être ≥ au prix partenaire';
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

    onSubmit({
      name: form.name.trim(),
      reference: form.reference.trim() || undefined,
      description: form.description.trim() || null,
      image: form.image.trim() || null,
      category_id: parseInt(form.category_id, 10),
      boutique_id: parseInt(form.boutique_id, 10),
      prix_partenaire: parseInt(form.prix_partenaire, 10),
      prix_vente: parseInt(form.prix_vente, 10),
      stock: parseInt(form.stock, 10) || 0,
      seuil_alerte: parseInt(form.seuil_alerte, 10) || 10,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nom du produit *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Riz 5kg"
          error={errors.name}
          required
        />
        <Input
          label="Référence SKU"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          placeholder="Auto-généré si vide"
        />
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
          label="Boutique *"
          value={form.boutique_id}
          onChange={(e) => setForm({ ...form, boutique_id: e.target.value })}
          error={errors.boutique_id}
          required
          disabled={!isAdmin && initial}
        >
          <option value="">— Sélectionner —</option>
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      </div>

      {/* Double prix obligatoire */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs font-medium text-amber-800 mb-3">
          ⚠️ Les deux prix sont obligatoires. Le prix de vente doit être ≥ au prix partenaire.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Prix partenaire (FCFA) *"
            type="number"
            min={0}
            value={form.prix_partenaire}
            onChange={(e) => setForm({ ...form, prix_partenaire: e.target.value })}
            error={errors.prix_partenaire}
            required
            disabled={!isAdmin && initial}
          />
          <Input
            label="Prix de vente (FCFA) *"
            type="number"
            min={0}
            value={form.prix_vente}
            onChange={(e) => setForm({ ...form, prix_vente: e.target.value })}
            error={errors.prix_vente}
            required
            disabled={!isAdmin && initial}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Marge unitaire</label>
            <div className={`px-3 py-2 rounded-lg text-sm font-semibold text-center
              ${marge !== null && marge >= 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500'}`}>
              {marge !== null ? `${marge.toLocaleString('fr-FR')} FCFA` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Stock initial"
          type="number"
          min={0}
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <Input
          label="Seuil d'alerte"
          type="number"
          min={0}
          value={form.seuil_alerte}
          onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })}
          help="Alerte quand stock ≤ seuil"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          maxLength={1000}
          placeholder="Description optionnelle..."
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
          <Save size={16} /> {initial ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}