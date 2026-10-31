// frontend/src/pages/Parametres.jsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Settings, Save, RotateCcw, Plus, Trash2,
  Building2, Shield, CreditCard, Server,
  AlertTriangle, CheckCircle2, Loader2, Eye, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

// ═══════════════════════════════════════════════
// Définition des groupes de paramètres
// ═══════════════════════════════════════════════
const GROUPS = [
  {
    key: 'company',
    label: 'Entreprise',
    icon: Building2,
    color: 'violet',
    fields: {
      company_name:              { label: 'Nom de l\'entreprise', type: 'text',     placeholder: 'Ex: khamis GLOBALE GROUPES' },
      company_logo:              { label: 'Logo (URL)',           type: 'text',     placeholder: 'https://...' },
      company_address:           { label: 'Adresse du siège',     type: 'text',     placeholder: 'Ex: N\'Djamena, Tchad' },
      company_phone:             { label: 'Téléphone',            type: 'text',     placeholder: 'Ex: +235 XX XX XX XX' },
      company_email:             { label: 'Email de contact',     type: 'text',     placeholder: 'contact@khamis.com' },
      default_currency:          { label: 'Devise par défaut',    type: 'select',   options: ['XAF', 'XOF', 'EUR', 'USD'] },
    },
  },
  {
    key: 'operations',
    label: 'Opérations',
    icon: Server,
    color: 'blue',
    fields: {
      stock_alert_threshold:     { label: 'Seuil d\'alerte stock', type: 'number', min: 0,   help: 'Nombre d\'unités sous lequel une alerte est déclenchée' },
      commission_rate:           { label: 'Taux de commission',   type: 'number', min: 0, max: 100, step: 0.1, suffix: '%', help: 'Pourcentage prélevé sur les ventes' },
      charge_validation_required:{ label: 'Validation admin des charges', type: 'boolean', help: 'Si activé, les charges créées par les gérants doivent être validées par un admin' },
      auto_validate_sales:       { label: 'Validation auto des ventes',   type: 'boolean', help: 'Si activé, les ventes sont validées automatiquement' },
    },
  },
  {
    key: 'payments',
    label: 'Paiements AlkherPay',
    icon: CreditCard,
    color: 'emerald',
    fields: {
      alkherpay_enabled:         { label: 'AlkherPay activé',     type: 'boolean', help: 'Active l\'intégration avec AlkherPay pour les paiements' },
      alkherpay_base_url:        { label: 'URL AlkherPay',        type: 'text',    placeholder: 'http://localhost:5000', help: 'URL du backend AlkherPay' },
      alkherpay_fee_percent:     { label: 'Frais AlkherPay',      type: 'number', min: 0, max: 100, step: 0.1, suffix: '%' },
      min_transaction:           { label: 'Transaction minimum',  type: 'number', min: 0, suffix: 'FCFA' },
    },
  },
  {
    key: 'security',
    label: 'Sécurité',
    icon: Shield,
    color: 'amber',
    fields: {
      session_timeout_hours:     { label: 'Expiration session (heures)', type: 'number', min: 1, max: 720, help: 'Durée de validité du token JWT' },
      max_login_attempts:        { label: 'Tentatives max de connexion', type: 'number', min: 1, max: 20 },
      password_min_length:       { label: 'Longueur minimum mot de passe', type: 'number', min: 4, max: 32 },
      require_2fa:               { label: 'Exiger 2FA (admins)',   type: 'boolean', help: 'Force l\'authentification à 2 facteurs pour les admins' },
      maintenance_mode:          { label: 'Mode maintenance',      type: 'boolean', help: 'Si activé, seule l\'équipe admin peut se connecter' },
    },
  },
];

// Toutes les clés connues (union de tous les groupes)
const KNOWN_KEYS = new Set(
  GROUPS.flatMap((g) => Object.keys(g.fields))
);

// ═══════════════════════════════════════════════
// Composant : champ selon le type
// ═══════════════════════════════════════════════
function SettingField({ fieldKey, config, value, originalValue, onChange }) {
  const isModified = String(value ?? '') !== String(originalValue ?? '');

  // Boolean → Switch
  if (config.type === 'boolean') {
    const checked = value === true || value === '1' || value === 'true' || value === 1;
    return (
      <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-800">{config.label}</label>
            {isModified && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                NON SAUVEGARDÉ
              </span>
            )}
          </div>
          {config.help && (
            <p className="text-xs text-slate-500 mt-0.5">{config.help}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(fieldKey, checked ? '0' : '1')}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors
            ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-1
              ${checked ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    );
  }

  // Select
  if (config.type === 'select') {
    return (
      <div className="py-3 border-b border-slate-100 last:border-b-0">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-slate-800">{config.label}</label>
          {isModified && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
              NON SAUVEGARDÉ
            </span>
          )}
        </div>
        {config.help && <p className="text-xs text-slate-500 mb-1">{config.help}</p>}
        <select
          value={value ?? ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        >
          <option value="">— Sélectionner —</option>
          {config.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  // Number
  if (config.type === 'number') {
    return (
      <div className="py-3 border-b border-slate-100 last:border-b-0">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-slate-800">{config.label}</label>
          {config.suffix && <span className="text-xs text-slate-400">({config.suffix})</span>}
          {isModified && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
              NON SAUVEGARDÉ
            </span>
          )}
        </div>
        {config.help && <p className="text-xs text-slate-500 mb-1">{config.help}</p>}
        <input
          type="number"
          value={value ?? ''}
          min={config.min}
          max={config.max}
          step={config.step || 1}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>
    );
  }

  // Text (défaut)
  return (
    <div className="py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
        <label className="text-sm font-medium text-slate-800">{config.label}</label>
        {isModified && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
            NON SAUVEGARDÉ
          </span>
        )}
      </div>
      {config.help && <p className="text-xs text-slate-500 mb-1">{config.help}</p>}
      <input
        type="text"
        value={value ?? ''}
        placeholder={config.placeholder || ''}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                   focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// Page principale
// ═══════════════════════════════════════════════
export default function Parametres() {
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [extraSettings, setExtraSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Modal ajout
  const [modalOpen, setModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('string');

  // ─────────────────────────────────────────────
  // Chargement
  // ─────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/parametres');
      const map = {};
      (data.data || []).forEach((s) => { map[s.key] = s.value; });
      setSettings(map);
      setOriginalSettings(map);

      // Détecter les paramètres non listés dans GROUPS
      const extras = (data.data || []).filter((s) => !KNOWN_KEYS.has(s.key));
      setExtraSettings(extras);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Impossible de charger les paramètres');
      toast.error('Erreur de chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─────────────────────────────────────────────
  // Changement d'un champ
  // ─────────────────────────────────────────────
  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  // ─────────────────────────────────────────────
  // Détection globale des modifications
  // ─────────────────────────────────────────────
  const modifiedKeys = useMemo(() => {
    const keys = new Set();
    for (const key of Object.keys(settings)) {
      if (String(settings[key] ?? '') !== String(originalSettings[key] ?? '')) {
        keys.add(key);
      }
    }
    // Nouveaux (présents dans settings mais pas originalSettings)
    for (const key of Object.keys(settings)) {
      if (!(key in originalSettings)) keys.add(key);
    }
    return Array.from(keys);
  }, [settings, originalSettings]);

  const hasChanges = modifiedKeys.length > 0;

  // ─────────────────────────────────────────────
  // Sauvegarde
  // ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('Aucune modification à enregistrer');
      return;
    }

    // Validation
    for (const group of GROUPS) {
      for (const [key, cfg] of Object.entries(group.fields)) {
        if (!modifiedKeys.includes(key)) continue;
        const v = settings[key];

        if (cfg.type === 'number') {
          const n = Number(v);
          if (v !== '' && v !== null && v !== undefined) {
            if (isNaN(n)) {
              toast.error(`${cfg.label} : doit être un nombre`);
              return;
            }
            if (cfg.min !== undefined && n < cfg.min) {
              toast.error(`${cfg.label} : minimum ${cfg.min}`);
              return;
            }
            if (cfg.max !== undefined && n > cfg.max) {
              toast.error(`${cfg.label} : maximum ${cfg.max}`);
              return;
            }
          }
        }
      }
    }

    setSaving(true);
    try {
      // Envoyer uniquement les modifications
      for (const key of modifiedKeys) {
        const raw = settings[key];
        const value = raw === null || raw === undefined ? '' : String(raw);

        // Déduire le type
        let type = 'string';
        if (value === '0' || value === '1' || value === 'true' || value === 'false') {
          type = 'boolean';
        } else if (/^-?\d+(\.\d+)?$/.test(value)) {
          type = 'number';
        }

        await api.put(`/parametres/${key}`, { value, type });
      }

      toast.success(
        modifiedKeys.length === 1
          ? 'Paramètre enregistré'
          : `${modifiedKeys.length} paramètres enregistrés`
      );
      await fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────
  const handleReset = () => {
    if (!hasChanges) return;
    if (!confirm('Annuler toutes les modifications non sauvegardées ?')) return;
    setSettings({ ...originalSettings });
    toast('Modifications annulées', { icon: '↩️' });
  };

  // ─────────────────────────────────────────────
  // Ajout d'un paramètre
  // ─────────────────────────────────────────────
  const handleAddNew = async () => {
    if (!newKey.trim()) {
      toast.error('La clé est requise');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(newKey)) {
      toast.error('La clé doit être en minuscules, chiffres et underscores');
      return;
    }
    if (newKey in settings) {
      toast.error('Ce paramètre existe déjà');
      return;
    }

    try {
      await api.put(`/parametres/${newKey}`, { value: newValue, type: newType });
      toast.success('Paramètre ajouté');
      setModalOpen(false);
      setNewKey('');
      setNewValue('');
      setNewType('string');
      await fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Suppression d'un paramètre
  // ─────────────────────────────────────────────
  const handleDelete = async (key) => {
    if (KNOWN_KEYS.has(key)) {
      toast.error('Impossible de supprimer un paramètre système. Modifiez sa valeur à la place.');
      return;
    }
    if (!confirm(`Supprimer définitivement "${key}" ?`)) return;

    try {
      await api.delete(`/parametres/${key}`);
      toast.success('Paramètre supprimé');
      await fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Rendu : loading / error
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="alert-danger">
          <AlertTriangle size={20} />
          <div>
            <p className="font-medium">Impossible de charger les paramètres</p>
            <p className="text-sm mt-1">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchSettings} className="mt-3">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // Rendu principal
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-brand-500" /> Paramètres
          </h1>
          <p className="text-sm text-slate-500">
            Configuration de la plateforme khamis GLOBALE GROUPES
          </p>
        </div>

        {hasChanges && (
          <Badge color="amber">
            {modifiedKeys.length} modification{modifiedKeys.length > 1 ? 's' : ''} non enregistrée{modifiedKeys.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Barre d'actions sticky */}
      <div className="sticky top-14 z-10 bg-slate-50 py-2 -my-2">
        <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            {hasChanges ? (
              <>
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-amber-700 font-medium">
                  Modifications en attente
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-slate-500">
                  Tout est à jour
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="btn-ghost btn-sm"
              title="Ajouter un paramètre personnalisé"
            >
              <Plus size={14} /> Ajouter
            </button>
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              <RotateCcw size={14} /> Annuler
            </button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
              size="sm"
            >
              <Save size={14} /> Enregistrer
            </Button>
          </div>
        </div>
      </div>

      {/* Groupes de paramètres */}
      {GROUPS.map((group) => {
        const Icon = group.icon;
        const groupFields = Object.entries(group.fields);
        const groupModified = groupFields.filter(([k]) => modifiedKeys.includes(k)).length;

        return (
          <div key={group.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header du groupe */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Icon size={18} className={`text-${group.color}-500`} />
                <h2 className="font-semibold text-slate-800">{group.label}</h2>
                {groupModified > 0 && (
                  <Badge color="amber">{groupModified}</Badge>
                )}
              </div>
            </div>

            {/* Champs */}
            <div className="px-5">
              {groupFields.map(([key, cfg]) => (
                <SettingField
                  key={key}
                  fieldKey={key}
                  config={cfg}
                  value={settings[key]}
                  originalValue={originalSettings[key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Paramètres personnalisés (non listés dans GROUPS) */}
      {extraSettings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800">Paramètres personnalisés</h2>
              <Badge color="slate">{extraSettings.length}</Badge>
            </div>
          </div>
          <div className="px-5">
            {extraSettings.map((s) => (
              <div
                key={s.key}
                className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 font-mono">
                      {s.key}
                    </span>
                    <Badge color="slate">{s.type || 'string'}</Badge>
                  </div>
                  <input
                    type="text"
                    value={settings[s.key] ?? ''}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
                <button
                  onClick={() => handleDelete(s.key)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-600 flex-shrink-0"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal ajout paramètre */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ajouter un paramètre personnalisé"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Clé</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="ex: my_custom_setting"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Minuscules, chiffres et underscores uniquement
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option value="string">Texte</option>
              <option value="number">Nombre</option>
              <option value="boolean">Booléen (0/1)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Valeur</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Valeur initiale"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddNew}>
              <Plus size={14} /> Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}