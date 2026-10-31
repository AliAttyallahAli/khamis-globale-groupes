// frontend/src/components/forms/PaiementForm.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Wallet, Save, X, Upload, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { TYPES_PAIEMENT, MOYENS_PAIEMENT } from '../../utils/constants';

const EMPTY = {
  type: 'salaire',
  montant: '',
  moyen_paiement: 'virement',
  justification: '',
  periode: '',
};

export default function PaiementForm({
  personnel = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(EMPTY);
    setFile(null);
    setErrors({});
  }, [personnel]);

  const validate = () => {
    const errs = {};
    if (!form.montant || parseInt(form.montant, 10) < 1) {
      errs.montant = 'Montant valide ≥ 1 requis';
    }
    if (!form.justification || form.justification.trim().length < 5) {
      errs.justification = 'Justification obligatoire (5 car. min)';
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

    const formData = new FormData();
    formData.append('type', form.type);
    formData.append('montant', parseInt(form.montant, 10).toString());
    formData.append('moyen_paiement', form.moyen_paiement);
    formData.append('justification', form.justification.trim());
    if (form.periode) formData.append('periode', form.periode);
    if (file) formData.append('piece_jointe', file);

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {personnel && (
        <div className="p-3 rounded-lg bg-brand-50 border border-brand-200">
          <p className="text-xs text-brand-700 font-medium uppercase">Personnel</p>
          <p className="text-sm font-semibold text-brand-900 mt-1">{personnel.fullname}</p>
          <p className="text-xs text-brand-600">{personnel.poste} · {personnel.boutique_name || 'Sans boutique'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Type de paiement *"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          required
        >
          {TYPES_PAIEMENT.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>

        <Input
          label="Montant (FCFA) *"
          type="number"
          min={1}
          value={form.montant}
          onChange={(e) => setForm({ ...form, montant: e.target.value })}
          error={errors.montant}
          required
          placeholder="Ex: 150000"
        />

        <Select
          label="Moyen de paiement *"
          value={form.moyen_paiement}
          onChange={(e) => setForm({ ...form, moyen_paiement: e.target.value })}
          required
        >
          {MOYENS_PAIEMENT.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>

        <Input
          label="Période"
          value={form.periode}
          onChange={(e) => setForm({ ...form, periode: e.target.value })}
          placeholder="Ex: 2026-10"
          maxLength={20}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Justification * <span className="text-red-500">(obligatoire, 5 car. min)</span>
        </label>
        <textarea
          value={form.justification}
          onChange={(e) => setForm({ ...form, justification: e.target.value })}
          rows={2}
          maxLength={500}
          required
          placeholder="Ex: Salaire Octobre 2026"
          className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm
            ${errors.justification ? 'border-red-400' : 'border-slate-300'}
            focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500`}
        />
        {errors.justification && (
          <p className="text-xs text-red-500 mt-1">{errors.justification}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          {form.justification.length} / 500 caractères
        </p>
      </div>

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