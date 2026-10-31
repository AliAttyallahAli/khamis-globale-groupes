// frontend/src/components/forms/ChargeForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Save, X, Upload, FileText, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { TYPES_CHARGE, MOYENS_PAIEMENT } from '../../utils/constants';

const EMPTY = {
  type: 'loyer',
  montant: '',
  justification: '',
  moyen_paiement: 'especes',
  boutique_id: '',
  date_charge: new Date().toISOString().slice(0, 10),
};

export default function ChargeForm({
  initial = null,
  boutiques = [],
  onSubmit,
  onCancel,
  loading = false,
  isAdmin = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        type: initial.type || 'loyer',
        montant: initial.montant || '',
        justification: initial.justification || '',
        moyen_paiement: initial.moyen_paiement || 'especes',
        boutique_id: initial.boutique_id || '',
        date_charge: initial.date_charge || EMPTY.date_charge,
      });
    } else {
      setForm(EMPTY);
      setFile(null);
    }
    setErrors({});
  }, [initial]);

  const validate = () => {
    const errs = {};
    if (!form.montant || parseInt(form.montant, 10) < 1) {
      errs.montant = 'Montant valide ≥ 1 requis';
    }
    if (!form.justification || form.justification.trim().length < 5) {
      errs.justification = 'Justification obligatoire (5 car. min)';
    }
    if (!form.type) errs.type = 'Type requis';
    if (!form.moyen_paiement) errs.moyen_paiement = 'Moyen de paiement requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Corrigez les erreurs');
      return;
    }

    const formData = new FormData();
    formData.append('type', form.type);
    formData.append('montant', parseInt(form.montant, 10).toString());
    formData.append('justification', form.justification.trim());
    formData.append('moyen_paiement', form.moyen_paiement);
    if (form.boutique_id) {
      formData.append('boutique_id', parseInt(form.boutique_id, 10).toString());
    }
    if (form.date_charge) {
      formData.append('date_charge', form.date_charge);
    }
    if (file) {
      formData.append('piece_jointe', file);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Type *"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          error={errors.type}
          required
        >
          {TYPES_CHARGE.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <Input
          label="Montant (FCFA) *"
          type="number"
          min={1}
          step={1}
          value={form.montant}
          onChange={(e) => setForm({ ...form, montant: e.target.value })}
          error={errors.montant}
          required
          placeholder="Ex: 5000"
        />

        <Select
          label="Moyen de paiement *"
          value={form.moyen_paiement}
          onChange={(e) => setForm({ ...form, moyen_paiement: e.target.value })}
          error={errors.moyen_paiement}
          required
        >
          {MOYENS_PAIEMENT.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>

        <div>
          <Select
            label="Boutique"
            value={form.boutique_id}
            onChange={(e) => setForm({ ...form, boutique_id: e.target.value })}
          >
            <option value="">— Aucune (charge générale) —</option>
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <p className="text-xs text-slate-500 mt-1">
            {form.boutique_id
              ? 'Charge rattachée à cette boutique'
              : 'Charge générale du groupe — validée par un admin'}
          </p>
        </div>

        <Input
          label="Date"
          type="date"
          value={form.date_charge}
          onChange={(e) => setForm({ ...form, date_charge: e.target.value })}
        />

        <div>
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Upload size={14} /> Pièce jointe <span className="text-slate-400 text-xs">(optionnel)</span>
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm
                       file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0
                       file:bg-brand-500 file:text-white file:text-xs file:font-medium"
          />
          {file && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <FileText size={12} /> {file.name} ({(file.size / 1024).toFixed(0)} Ko)
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Justification * <span className="text-red-500">(obligatoire, 5 car. min)</span>
        </label>
        <textarea
          value={form.justification}
          onChange={(e) => setForm({ ...form, justification: e.target.value })}
          rows={3}
          maxLength={500}
          required
          placeholder="Ex: Achat fournitures pour le bureau"
          className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm
            ${errors.justification ? 'border-red-400' : 'border-slate-300'}
            focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500`}
        />
        {errors.justification && (
          <p className="text-xs text-red-500 mt-1">{errors.justification}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">{form.justification.length} / 500 caractères</p>
      </div>

      {!isAdmin && (
        <div className="alert-warning text-sm">
          <AlertCircle size={16} />
          <span>Votre charge sera <strong>en attente</strong> de validation par un administrateur.</span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X size={16} /> Annuler
          </Button>
        )}
        <Button type="submit" loading={loading}>
          <Save size={16} /> Enregistrer
        </Button>
      </div>
    </form>
  );
}