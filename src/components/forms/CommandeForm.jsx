// frontend/src/components/forms/CommandeForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, XCircle, Store, Package, Save } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatCFA } from '../../utils/formatters';

const EMPTY = { boutique_id: '', lignes: [{ produit_id: '', quantite: 1 }] };

export default function CommandeForm({
  boutiques = [],
  produitsParBoutique = {},
  onSubmit,
  onCancel,
  loading = false,
  onBoutiqueChange,
}) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(EMPTY);
  }, []);

  const produits = form.boutique_id ? (produitsParBoutique[form.boutique_id] || []) : [];

  const handleBoutiqueChange = (value) => {
    setForm({ ...EMPTY, boutique_id: value });
    if (onBoutiqueChange) onBoutiqueChange(value);
  };

  const addLigne = () =>
    setForm({
      ...form,
      lignes: [...form.lignes, { produit_id: '', quantite: 1 }],
    });

  const updateLigne = (idx, field, value) => {
    const newLignes = [...form.lignes];
    newLignes[idx][field] = value;
    setForm({ ...form, lignes: newLignes });
  };

  const removeLigne = (idx) => {
    if (form.lignes.length === 1) return;
    setForm({
      ...form,
      lignes: form.lignes.filter((_, i) => i !== idx),
    });
  };

  // Calculs temps réel
  const totalVente = form.lignes.reduce((sum, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id));
    if (!p) return sum;
    return sum + p.prix_vente * (parseInt(l.quantite) || 0);
  }, 0);

  const margeEstimee = form.lignes.reduce((sum, l) => {
    const p = produits.find((pp) => pp.id === parseInt(l.produit_id));
    if (!p) return sum;
    return sum + (p.prix_vente - p.prix_partenaire) * (parseInt(l.quantite) || 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.boutique_id) return toast.error('Sélectionnez une boutique');

    const validLignes = form.lignes.filter(
      (l) => l.produit_id && parseInt(l.quantite, 10) > 0
    );
    if (validLignes.length === 0) return toast.error('Ajoutez au moins un produit');

    // Contrôle stock
    for (const l of validLignes) {
      const p = produits.find((pp) => pp.id === parseInt(l.produit_id));
      if (p && parseInt(l.quantite, 10) > p.stock) {
        return toast.error(`Stock insuffisant pour "${p.name}" (${p.stock} dispo)`);
      }
    }

    onSubmit({
      boutique_id: parseInt(form.boutique_id, 10),
      lignes: validLignes.map((l) => ({
        produit_id: parseInt(l.produit_id, 10),
        quantite: parseInt(l.quantite, 10),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bloc boutique */}
      <div className="p-4 rounded-xl bg-brand-50 border-2 border-brand-200">
        <label className="text-sm font-semibold text-brand-900 flex items-center gap-2 mb-2">
          <Store size={16} /> 1. Choisissez la boutique *
        </label>
        {boutiques.length === 0 ? (
          <p className="text-sm text-amber-700">Aucune boutique disponible</p>
        ) : (
          <select
            value={form.boutique_id}
            onChange={(e) => handleBoutiqueChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border-2 border-brand-300 bg-white text-sm font-medium
                       focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            required
          >
            <option value="">— Sélectionnez une boutique —</option>
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        <p className="text-xs text-brand-700 mt-1">
          {boutiques.length} boutique{boutiques.length > 1 ? 's' : ''} disponible{boutiques.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Bloc produits */}
      {form.boutique_id && (
        <>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <Package size={16} /> 2. Ajoutez les produits
            </label>
            {produits.length === 0 ? (
              <p className="text-sm text-amber-700">Aucun produit dans cette boutique</p>
            ) : (
              <div className="space-y-2">
                {form.lignes.map((l, idx) => {
                  const produit = produits.find((p) => p.id === parseInt(l.produit_id));
                  return (
                    <div key={idx} className="flex gap-2 items-start">
                      <select
                        value={l.produit_id}
                        onChange={(e) => updateLigne(idx, 'produit_id', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      >
                        <option value="">— Sélectionner un produit —</option>
                        {produits.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock}) — {formatCFA(p.prix_vente)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={produit?.stock || 999}
                        value={l.quantite}
                        onChange={(e) => updateLigne(idx, 'quantite', e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg border border-slate-300 text-sm text-center"
                      />
                      <button
                        type="button"
                        onClick={() => removeLigne(idx)}
                        disabled={form.lignes.length === 1}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-30"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addLigne}
                  className="text-sm text-brand-500 hover:underline font-medium flex items-center gap-1"
                >
                  <Plus size={14} /> Ajouter une ligne
                </button>
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">Total vente</span>
              <span className="font-semibold text-slate-900">{formatCFA(totalVente)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">Marge estimée</span>
              <span className="font-bold text-emerald-600 text-lg">{formatCFA(margeEstimee)}</span>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            <XCircle size={16} /> Annuler
          </Button>
        )}
        <Button
          type="submit"
          loading={loading}
          disabled={!form.boutique_id || produits.length === 0}
        >
          <ShoppingCart size={16} /> Créer la commande
        </Button>
      </div>
    </form>
  );
}