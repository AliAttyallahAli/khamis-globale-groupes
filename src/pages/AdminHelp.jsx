// frontend/src/pages/AdminHelp.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, EyeOff, FileText, Video,
  Link as LinkIcon, Search, X, ArrowLeft, Upload,
  Download, ExternalLink, Settings, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { helpApi } from '../api/help.api';
import { formatDate } from '../utils/formatters';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, '');
const buildFileUrl = (p) =>
  !p ? '' : p.startsWith('http') ? p : `${BASE_URL}/${p.replace(/^\.?\/?/, '')}`;

const TYPES = [
  { value: 'guide', label: 'Guide (fichier)', icon: FileText, color: 'blue' },
  { value: 'video', label: 'Vidéo YouTube', icon: Video, color: 'red' },
  { value: 'link', label: 'Lien externe', icon: LinkIcon, color: 'emerald' },
];

const CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'demarrage', label: 'Démarrage rapide' },
  { value: 'produits', label: 'Produits' },
  { value: 'commandes', label: 'Commandes' },
  { value: 'ventes', label: 'Ventes' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'charges', label: 'Charges' },
  { value: 'alkherpay', label: 'AlkherPay' },
  { value: 'rapports', label: 'Rapports' },
  { value: 'structure', label: 'Structure' },
  { value: 'finance', label: 'Finance' },
];

const TYPE_CONFIG = {
  guide: { icon: FileText, color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700' },
  video: { icon: Video, color: 'red', bg: 'bg-red-100', text: 'text-red-700' },
  link: { icon: LinkIcon, color: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const EMPTY_FORM = {
  type: 'guide',
  category: 'general',
  title: '',
  description: '',
  url: '',
  order_index: 0,
};

// ═══════════════════════════════════════════════
// Helper YouTube
// ═══════════════════════════════════════════════
function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match ? match[1] : null;
}

export default function AdminHelp() {
  // ─────────────────────────────────────────────
  // État liste
  // ─────────────────────────────────────────────
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // ─────────────────────────────────────────────
  // État formulaire
  // ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await helpApi.resources({
        type: filterType !== 'all' ? filterType : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        search: search || undefined,
      });
      setResources(data.data || []);
    } catch (err) {
      toast.error('Erreur chargement ressources');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, search]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // ─────────────────────────────────────────────
  // Modal
  // ─────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setModalOpen(true);
  };

  const openEdit = (resource) => {
    setEditing(resource);
    setForm({
      type: resource.type,
      category: resource.category,
      title: resource.title,
      description: resource.description || '',
      url: resource.url || '',
      order_index: resource.order_index || 0,
    });
    setFile(null);
    setModalOpen(true);
  };

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    if (form.type === 'guide' && !file && !editing) {
      toast.error('Un fichier est requis pour un guide');
      return;
    }
    if ((form.type === 'video' || form.type === 'link') && !form.url.trim()) {
      toast.error('Une URL est requise');
      return;
    }
    if (form.type === 'video' && !extractYoutubeId(form.url)) {
      toast.error('URL YouTube invalide (format: youtube.com/watch?v=... ou youtu.be/...)');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('category', form.category);
      fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);
      if (form.url) fd.append('url', form.url);
      fd.append('order_index', form.order_index || 0);
      if (file) fd.append('file', file);

      if (editing) {
        await helpApi.update(editing.id, fd);
        toast.success('Ressource modifiée');
      } else {
        await helpApi.create(fd);
        toast.success('Ressource créée');
      }

      setModalOpen(false);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Toggle actif
  // ─────────────────────────────────────────────
  const handleToggle = async (resource) => {
    if (!confirm(`Changer le statut de "${resource.title}" ?`)) return;
    try {
      const fd = new FormData();
      fd.append('is_active', resource.is_active ? '0' : '1');
      await helpApi.update(resource.id, fd);
      toast.success(`Ressource ${resource.is_active ? 'désactivée' : 'activée'}`);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────
  const handleDelete = async (resource) => {
    if (!confirm(`Supprimer définitivement "${resource.title}" ?`)) return;
    try {
      await helpApi.delete(resource.id);
      toast.success('Ressource supprimée');
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Compteurs
  // ─────────────────────────────────────────────
  const counts = {
    guide: resources.filter((r) => r.type === 'guide').length,
    video: resources.filter((r) => r.type === 'video').length,
    link: resources.filter((r) => r.type === 'link').length,
  };

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Retour + En-tête */}
      <div>
        <Link
          to="/aide"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft size={14} /> Retour au centre d'aide
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="text-brand-500" /> Gestion des ressources d'aide
            </h1>
            <p className="text-sm text-slate-500">
              Créez et gérez les guides, vidéos et liens du centre d'aide
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} /> Nouvelle ressource
          </Button>
        </div>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-3">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const count = counts[t.value];
          const config = TYPE_CONFIG[t.value];
          return (
            <div
              key={t.value}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={config.text} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{count}</div>
                <div className="text-xs text-slate-500">{t.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une ressource..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
            >
              <X size={12} className="text-slate-500" />
            </button>
          )}
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="all">Tous types</option>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {(search || filterType !== 'all' || filterCategory !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterType('all'); setFilterCategory('all'); }}
            className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-12">
          <EmptyState
            title="Aucune ressource"
            message="Commencez par ajouter votre premier guide, vidéo ou lien"
            icon={FileText}
          />
          <div className="flex justify-center mt-4">
            <Button onClick={openCreate}>
              <Plus size={16} /> Créer une ressource
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map((resource) => {
            const config = TYPE_CONFIG[resource.type];
            const Icon = config.icon;
            const ytId = resource.type === 'video' ? extractYoutubeId(resource.url) : null;

            return (
              <div
                key={resource.id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-all
                  ${resource.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}
              >
                {/* Icône / thumbnail */}
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${config.bg}`}>
                  {ytId ? (
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon size={22} className={config.text} />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-slate-800 truncate">{resource.title}</h3>
                    <Badge color={config.color}>{config.label}</Badge>
                    <Badge color="slate">
                      {CATEGORIES.find((c) => c.value === resource.category)?.label || resource.category}
                    </Badge>
                    {!resource.is_active && (
                      <Badge color="red">Inactif</Badge>
                    )}
                  </div>

                  {resource.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    <span>Créé le {formatDate(resource.created_at)}</span>

                    {resource.type === 'guide' && resource.file_path && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileText size={10} /> {resource.file_size ? `${(resource.file_size / 1024).toFixed(0)} Ko` : '—'}
                        </span>
                      </>
                    )}

                    {resource.type === 'video' && resource.url && (
                      <>
                        <span>•</span>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-600 hover:underline flex items-center gap-1 truncate max-w-[300px]"
                        >
                          <Video size={10} /> {resource.url}
                        </a>
                      </>
                    )}

                    {resource.type === 'link' && resource.url && (
                      <>
                        <span>•</span>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 truncate max-w-[300px]"
                        >
                          <ExternalLink size={10} /> {resource.url}
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {resource.type === 'guide' && resource.file_path && (
                    <a
                      href={buildFileUrl(resource.file_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                      title="Télécharger"
                    >
                      <Download size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => handleToggle(resource)}
                    className={`p-1.5 rounded ${resource.is_active
                      ? 'hover:bg-amber-50 text-amber-600'
                      : 'hover:bg-emerald-50 text-emerald-600'}`}
                    title={resource.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {resource.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => openEdit(resource)}
                    className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                    title="Modifier"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(resource)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ MODAL CRÉATION / ÉDITION ═══════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la ressource' : 'Nouvelle ressource'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Type de ressource *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const isActive = form.type === t.value;
                const config = TYPE_CONFIG[t.value];
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    disabled={!!editing}
                    className={`p-3 rounded-lg border-2 transition-all text-center
                      ${isActive
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'}
                      ${editing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon
                      size={24}
                      className={`mx-auto mb-1 ${isActive ? 'text-brand-600' : 'text-slate-400'}`}
                    />
                    <div className="text-xs font-medium text-slate-700">{t.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catégorie */}
          <Select
            label="Catégorie *"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>

          {/* Titre */}
          <Input
            label="Titre *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Guide de démarrage rapide"
            required
            minLength={3}
            maxLength={200}
          />

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              maxLength={1000}
              placeholder="Description optionnelle..."
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Upload fichier (guide) */}
          {form.type === 'guide' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Fichier {editing ? '(laisser vide pour ne pas changer)' : '*'}
              </label>

              {editing?.file_path && (
                <div className="mb-2 p-2 rounded-lg bg-slate-50 flex items-center gap-2 text-xs">
                  <FileText size={14} className="text-slate-500" />
                  <span className="text-slate-600 truncate">Fichier actuel</span>
                  <a
                    href={buildFileUrl(editing.file_path)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-blue-600 hover:underline"
                  >
                    Voir
                  </a>
                </div>
              )}

              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg
                           file:border-0 file:bg-brand-500 file:text-white file:text-sm file:font-medium
                           file:cursor-pointer hover:file:bg-brand-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                PDF, DOCX, XLSX, images — max 20 Mo
              </p>
              {file && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-50 flex items-center gap-2 text-xs">
                  <Upload size={12} className="text-emerald-600" />
                  <span className="text-emerald-800 flex-1 truncate">{file.name}</span>
                  <span className="text-emerald-600">{(file.size / 1024).toFixed(0)} Ko</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 rounded hover:bg-emerald-100"
                  >
                    <X size={12} className="text-emerald-700" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* URL (video / link) */}
          {(form.type === 'video' || form.type === 'link') && (
            <div>
              <Input
                label={form.type === 'video' ? 'URL YouTube *' : 'URL externe *'}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder={
                  form.type === 'video'
                    ? 'https://www.youtube.com/watch?v=XXXX'
                    : 'https://example.com/page'
                }
                required
              />
              {form.type === 'video' && form.url && !extractYoutubeId(form.url) && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    URL YouTube invalide. Utilisez le format youtube.com/watch?v=... ou youtu.be/...
                  </p>
                </div>
              )}
              {form.type === 'video' && form.url && extractYoutubeId(form.url) && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                  <Video size={14} className="text-emerald-600" />
                  <p className="text-xs text-emerald-800 flex-1">
                    Vidéo YouTube valide (ID: {extractYoutubeId(form.url)})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ordre */}
          <Input
            label="Ordre d'affichage"
            type="number"
            min={0}
            value={form.order_index}
            onChange={(e) => setForm({ ...form, order_index: e.target.value })}
            placeholder="0"
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Enregistrer' : 'Créer la ressource'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}