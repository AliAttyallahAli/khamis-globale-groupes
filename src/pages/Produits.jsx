// frontend/src/pages/Produits.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit, Trash2, AlertTriangle, Package,
  RefreshCw, Image as ImageIcon, Eye, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { produitsApi } from '../api/produits.api';
import { categoriesApi } from '../api/categories.api';
import { boutiquesApi } from '../api/boutiques.api';
import { useAuth } from '../context/AuthContext';
import { formatCFA } from '../utils/formatters';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import DataTable from '../components/data/DataTable';
import FilterBar from '../components/data/FilterBar';
import Pagination from '../components/data/Pagination';
import ExportButtons from '../components/data/ExportButtons';
import ImageUploader from '../components/forms/ImageUploader';
import ImageGallery from '../components/forms/ImageGallery';

// URL de base pour les images statiques (uploads)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, '');
const buildImageUrl = (p) =>
  !p ? '' : p.startsWith('http') ? p : `${BASE_URL}/${p.replace(/^\.?\/?/, '')}`;

const EMPTY_FORM = {
  name: '',
  reference: '',
  description: '',
  category_id: '',
  boutique_id: '',
  prix_partenaire: '',
  prix_vente: '',
  stock: 0,
  seuil_alerte: 10,
};

export default function Produits() {
  const { user, isAdmin } = useAuth();

  // ─────────────────────────────────────────────
  // État liste
  // ─────────────────────────────────────────────
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [boutiqueId, setBoutiqueId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // ─────────────────────────────────────────────
  // État formulaire
  // ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState([]);        // File[] nouveaux
  const [existingImages, setExistingImages] = useState([]); // images déjà en base
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // État détail
  // ─────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // ─────────────────────────────────────────────
  // Chargement dépendances (catégories + boutiques)
  // ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      categoriesApi.list({ is_active: 1 }).then((d) => d.data || []),
      boutiquesApi.list({ is_active: 1, limit: 500 }).then((d) => d.data || []),
    ])
      .then(([cats, bs]) => { setCategories(cats); setBoutiques(bs); })
      .catch(console.warn);
  }, []);

  // ─────────────────────────────────────────────
  // Fetch produits
  // ─────────────────────────────────────────────
  const fetchProduits = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search || undefined,
        category_id: categoryId || undefined,
        boutique_id: boutiqueId || undefined,
        low_stock: lowStockOnly ? 1 : undefined,
        is_active: 1,
      };
      const data = await produitsApi.list(params);
      setProduits(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, boutiqueId, lowStockOnly]);

  useEffect(() => { fetchProduits(); }, [fetchProduits]);

  // ─────────────────────────────────────────────
  // Ouvrir modal création
  // ─────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setExistingImages([]);
    setModalOpen(true);
  };

  // ─────────────────────────────────────────────
  // Ouvrir modal édition
  // ─────────────────────────────────────────────
  const openEdit = async (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      reference: p.reference,
      description: p.description || '',
      category_id: p.category_id,
      boutique_id: p.boutique_id,
      prix_partenaire: p.prix_partenaire,
      prix_vente: p.prix_vente,
      stock: p.stock,
      seuil_alerte: p.seuil_alerte,
    });
    setImageFiles([]);
    setModalOpen(true);

    // Charger les images complètes depuis l'API détail
    try {
      const res = await produitsApi.get(p.id);
      setExistingImages(res.produit.images || []);
    } catch {
      setExistingImages(p.images || []);
    }
  };

  // ─────────────────────────────────────────────
  // Soumission formulaire
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        // 1. Mise à jour des infos produit (JSON)
        await produitsApi.update(editing.id, {
          name: form.name,
          description: form.description || undefined,
          category_id: parseInt(form.category_id, 10),
          boutique_id: parseInt(form.boutique_id, 10),
          prix_partenaire: parseInt(form.prix_partenaire, 10),
          prix_vente: parseInt(form.prix_vente, 10),
          stock: parseInt(form.stock, 10) || 0,
          seuil_alerte: parseInt(form.seuil_alerte, 10) || 10,
        });

        // 2. Ajout des nouvelles images (multipart)
        if (imageFiles.length > 0) {
          const fd = new FormData();
          imageFiles.forEach((f) => fd.append('images', f));
          await produitsApi.addImages(editing.id, fd);
        }

        toast.success('Produit modifié');
      } else {
        // Création : multipart avec images
        const fd = new FormData();
        fd.append('name', form.name);
        if (form.reference) fd.append('reference', form.reference);
        if (form.description) fd.append('description', form.description);
        fd.append('category_id', form.category_id);
        fd.append('boutique_id', form.boutique_id);
        fd.append('prix_partenaire', form.prix_partenaire);
        fd.append('prix_vente', form.prix_vente);
        if (form.stock !== '') fd.append('stock', form.stock);
        if (form.seuil_alerte !== '') fd.append('seuil_alerte', form.seuil_alerte);
        imageFiles.forEach((f) => fd.append('images', f));

        await produitsApi.createMultipart(fd);
        toast.success('Produit créé');
      }

      setModalOpen(false);
      fetchProduits();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Actions images existantes
  // ─────────────────────────────────────────────
  const handleRemoveExisting = async (imageId) => {
    if (!confirm('Supprimer cette image ?')) return;
    try {
      await produitsApi.deleteImage(editing.id, imageId);
      setExistingImages((prev) => prev.filter((i) => i.id !== imageId));
      toast.success('Image supprimée');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await produitsApi.setPrimaryImage(editing.id, imageId);
      setExistingImages((prev) =>
        prev.map((i) => ({ ...i, is_primary: i.id === imageId ? 1 : 0 }))
      );
      toast.success('Image principale définie');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  // ─────────────────────────────────────────────
  // Actions liste
  // ─────────────────────────────────────────────
  const handleDelete = async (p) => {
    if (!confirm(`Désactiver "${p.name}" ?`)) return;
    try {
      await produitsApi.delete(p.id);
      toast.success('Produit désactivé');
      fetchProduits();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleStock = async (p) => {
    const val = prompt(`Ajuster le stock de "${p.name}" (actuel : ${p.stock})`, p.stock);
    if (val === null) return;
    const newStock = parseInt(val, 10);
    if (isNaN(newStock) || newStock < 0) return toast.error('Valeur invalide');
    try {
      await produitsApi.adjustStock(p.id, { new_stock: newStock, reason: 'Ajustement manuel' });
      toast.success('Stock mis à jour');
      fetchProduits();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const openDetail = async (p) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await produitsApi.get(p.id);
      setDetail(res.produit);
    } catch (err) {
      toast.error('Erreur chargement détail');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Aperçu marge
  // ─────────────────────────────────────────────
  const margePreview =
    form.prix_partenaire && form.prix_vente
      ? parseInt(form.prix_vente, 10) - parseInt(form.prix_partenaire, 10)
      : null;

  // ─────────────────────────────────────────────
  // Colonnes tableau
  // ─────────────────────────────────────────────
  const columns = [
    {
      key: 'image',
      label: '',
      width: '64px',
      render: (r) => (
        <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center ring-1 ring-slate-200">
          {r.image_principale ? (
            <img
              src={buildImageUrl(r.image_principale)}
              alt={r.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon size={16} className="text-slate-400" />
          )}
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Référence',
      render: (r) => <span className="font-mono text-xs">{r.reference}</span>,
    },
    {
      key: 'name',
      label: 'Nom',
      render: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          {r.images?.length > 1 && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              {r.images.length} image(s)
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category_name',
      label: 'Catégorie',
      render: (r) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: `${r.category_color}20`, color: r.category_color }}
        >
          {r.category_name}
        </span>
      ),
    },
    { key: 'boutique_name', label: 'Boutique' },
    {
      key: 'prix_partenaire',
      label: 'Prix partenaire',
      align: 'right',
      render: (r) => formatCFA(r.prix_partenaire),
    },
    {
      key: 'prix_vente',
      label: 'Prix vente',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCFA(r.prix_vente)}</span>,
    },
    {
      key: 'marge_unitaire',
      label: 'Marge',
      align: 'right',
      render: (r) => (
        <span className="text-emerald-600 font-semibold">{formatCFA(r.marge_unitaire)}</span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      align: 'right',
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 font-semibold
            ${r.alerte_stock ? 'text-red-600' : 'text-slate-700'}`}
        >
          {r.alerte_stock && <AlertTriangle size={14} />}
          {r.stock}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openDetail(r); }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Voir détail"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleStock(r); }}
            className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
            title="Ajuster stock"
          >
            <RefreshCw size={14} />
          </button>
          {(isAdmin || user?.role === 'gerant') && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(r); }}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
              title="Modifier"
            >
              <Edit size={14} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
              className="p-1.5 rounded hover:bg-red-50 text-red-600"
              title="Désactiver"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-brand-500" /> Produits
          </h1>
          <p className="text-sm text-slate-500">{total} produit(s) au total</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            endpoint="/rapports/produits"
            params={{ boutique_id: boutiqueId }}
            filenameBase="produits"
          />
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Nouveau produit
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onReset={() => {
          setSearch(''); setCategoryId(''); setBoutiqueId('');
          setLowStockOnly(false); setPage(1);
        }}
      >
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={boutiqueId}
          onChange={(e) => { setBoutiqueId(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        >
          <option value="">Toutes boutiques</option>
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 px-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Stock bas uniquement
        </label>
      </FilterBar>

      {/* Tableau */}
      <DataTable
        columns={columns}
        data={produits}
        loading={loading}
        emptyTitle="Aucun produit"
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL CRÉATION / ÉDITION                     */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le produit' : 'Nouveau produit'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Infos de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom du produit *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
            />
            <Input
              label="Référence SKU (auto si vide)"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Auto-généré"
              disabled={!!editing}
            />
            <Select
              label="Catégorie *"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
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
              required
            >
              <option value="">— Sélectionner —</option>
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>

          {/* Prix + marge */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800 font-medium mb-2">
              ⚠️ Les deux prix sont obligatoires. Le prix de vente doit être ≥ au prix partenaire.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Prix partenaire (FCFA) *"
                type="number"
                min={0}
                value={form.prix_partenaire}
                onChange={(e) => setForm({ ...form, prix_partenaire: e.target.value })}
                required
              />
              <Input
                label="Prix de vente (FCFA) *"
                type="number"
                min={form.prix_partenaire || 0}
                value={form.prix_vente}
                onChange={(e) => setForm({ ...form, prix_vente: e.target.value })}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Marge unitaire</label>
                <div
                  className={`px-3 py-2 rounded-lg text-sm font-semibold
                    ${margePreview !== null && margePreview >= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'}`}
                >
                  {margePreview !== null ? formatCFA(margePreview) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock initial"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              disabled={!!editing}
            />
            <Input
              label="Seuil d'alerte"
              type="number"
              min={0}
              value={form.seuil_alerte}
              onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Images du produit{' '}
              <span className="text-slate-400 text-xs">(jusqu'à 10 images)</span>
            </label>
            <ImageUploader
              files={imageFiles}
              onChange={setImageFiles}
              existingImages={existingImages}
              onRemoveExisting={handleRemoveImageSafe}
              onSetPrimary={handleSetPrimary}
            />
          </div>

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
              {editing ? 'Enregistrer' : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL DÉTAIL                                 */}
      {/* ═══════════════════════════════════════════ */}
      <Modal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetail(null); }}
        title="Détail du produit"
        size="lg"
      >
        {detailLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : detail ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Galerie */}
            <div>
              <ImageGallery images={detail.images || []} alt={detail.name} />
            </div>

            {/* Infos */}
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs mb-2"
                  style={{
                    backgroundColor: `${detail.category_color || '#1e3a5f'}20`,
                    color: detail.category_color || '#1e3a5f',
                  }}
                >
                  {detail.category_name}
                </span>
                <h2 className="text-xl font-bold text-slate-800">{detail.name}</h2>
                <p className="text-xs font-mono text-slate-500 mt-1">{detail.reference}</p>
              </div>

              {detail.description && (
                <p className="text-sm text-slate-600">{detail.description}</p>
              )}

              <div className="p-4 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Prix partenaire</span>
                  <span className="font-medium">{formatCFA(detail.prix_partenaire)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Prix de vente</span>
                  <span className="font-semibold">{formatCFA(detail.prix_vente)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Marge unitaire</span>
                  <span className="text-emerald-600 font-bold">{formatCFA(detail.marge_unitaire)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs text-slate-500">Stock</p>
                  <p className={`text-lg font-bold ${detail.stock <= detail.seuil_alerte ? 'text-red-600' : 'text-slate-800'}`}>
                    {detail.stock}
                  </p>
                  <p className="text-[10px] text-slate-400">Seuil : {detail.seuil_alerte}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs text-slate-500">Boutique</p>
                  <p className="text-sm font-semibold text-slate-800">{detail.boutique_name}</p>
                </div>
              </div>

              {detail.stats && (
                <div className="p-3 rounded-xl bg-brand-50 border border-brand-200">
                  <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-2">
                    Statistiques de vente
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Quantité vendue</span>
                      <span className="font-semibold">{detail.stats.quantite_totale_vendue || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">CA total</span>
                      <span className="font-semibold">{formatCFA(detail.stats.ca_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Marge totale</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCFA(detail.stats.marge_totale || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );

  // ─────────────────────────────────────────────
  // Handler interne safe (n'appelle handleRemoveExisting que si on édite)
  // ─────────────────────────────────────────────
  function handleRemoveImageSafe(imageId) {
    if (!editing) {
      toast.error('Enregistrez d\'abord le produit avant de supprimer ses images');
      return;
    }
    handleRemoveExisting(imageId);
  }
}