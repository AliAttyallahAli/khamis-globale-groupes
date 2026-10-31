// frontend/src/pages/Market.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, X, ShoppingBag, Package, Tag, Store,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { marketApi } from '../api/market.api';
import { useAuth } from '../context/AuthContext';

import ProductCard from '../components/market/ProductCard';
import ProductDetailModal from '../components/market/ProductDetailModal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Nouveautés' },
  { value: 'prix_vente_asc', label: 'Prix croissant' },
  { value: 'prix_vente_desc', label: 'Prix décroissant' },
  { value: 'name_asc', label: 'Nom A→Z' },
  { value: 'stock_desc', label: 'Stock' },
];

export default function Market() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [boutiques, setBoutiques] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [boutiqueId, setBoutiqueId] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortValue, setSortValue] = useState('created_at_desc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modal produit
  const [selectedProduitId, setSelectedProduitId] = useState(null);

  // ─────────────────────────────────────────────
  // Chargement initial (catégories, boutiques, stats)
  // ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      marketApi.categories().then((d) => d.data || []),
      marketApi.boutiques().then((d) => d.data || []),
      marketApi.stats().then((d) => d.stats || null),
    ])
      .then(([cats, bs, s]) => {
        setCategories(cats);
        setBoutiques(bs);
        setStats(s);
      })
      .catch((err) => console.warn('Erreur chargement meta market:', err));
  }, []);

  // ─────────────────────────────────────────────
  // Ouverture auto du modal si ?produit=ID dans l'URL
  // ─────────────────────────────────────────────
  useEffect(() => {
    const produitParam = searchParams.get('produit');
    if (produitParam) {
      setSelectedProduitId(parseInt(produitParam, 10));
    }
  }, [searchParams]);

  // ─────────────────────────────────────────────
  // Fetch produits
  // ─────────────────────────────────────────────
  const fetchProduits = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ FIX : extraire sort et order en partant de la FIN
      // 'created_at_desc' → sort='created_at', order='desc'
      // 'prix_vente_asc'  → sort='prix_vente',  order='asc'
      const parts = sortValue.split('_');
      const order = parts.pop();       // 'asc' | 'desc'
      const sort = parts.join('_');    // 'created_at' | 'prix_vente' | 'name' | 'stock'

      const data = await marketApi.produits({
        page,
        limit: 24,
        search: search || undefined,
        category_id: categoryId || undefined,
        boutique_id: boutiqueId || undefined,
        in_stock: inStockOnly ? 1 : undefined,
        sort,
        order,
      });
      setProduits(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Erreur marché:', err);
      toast.error(
        err.response?.data?.error || 'Erreur lors du chargement du catalogue'
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, boutiqueId, inStockOnly, sortValue]);

  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  // Reset page quand filtres changent
  useEffect(() => {
    setPage(1);
  }, [search, categoryId, boutiqueId, inStockOnly, sortValue]);

  // ─────────────────────────────────────────────
  // Reset filtres
  // ─────────────────────────────────────────────
  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setBoutiqueId('');
    setInStockOnly(false);
    setSortValue('created_at_desc');
  };

  const hasActiveFilters =
    search || categoryId || boutiqueId || inStockOnly || sortValue !== 'created_at_desc';

  const closeModal = () => {
    setSelectedProduitId(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('produit');
    setSearchParams(newParams, { replace: true });
  };

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ═══════ HERO HEADER ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">KHAMIS Market</p>
                <p className="text-[11px] text-white/70">La place du groupe</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                  >
                    Mon espace
                  </button>
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {user?.fullname?.[0]?.toUpperCase() || '?'}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white/90 hover:text-white"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 rounded-lg bg-white text-brand-700 text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    Inscription
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Titre principal */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-4">
              <Sparkles size={12} /> Découvrez nos produits
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Achetez en ligne,<br />
              <span className="text-accent-300">rapidement et facilement</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg">
              Parcourez le catalogue de toutes nos boutiques et commandez en quelques clics.
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 md:gap-8 mt-10 max-w-lg">
              <div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stats.nb_produits || 0}
                </div>
                <div className="text-xs md:text-sm text-white/70">Produits</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stats.nb_categories || 0}
                </div>
                <div className="text-xs md:text-sm text-white/70">Catégories</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">
                  {stats.nb_boutiques || 0}
                </div>
                <div className="text-xs md:text-sm text-white/70">Boutiques</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ SEARCH BAR (sticky) ═══════ */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit, une marque, une référence..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
                           transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              )}
            </div>

            {/* Filtres mobile toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`md:hidden relative p-2.5 rounded-xl border transition-colors
                ${filtersOpen
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-slate-700 border-slate-200'}`}
            >
              <Filter size={18} />
              {hasActiveFilters && !filtersOpen && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Tri (desktop) */}
            <div className="hidden md:block">
              <select
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtres dépliés (mobile) */}
          {filtersOpen && (
            <div className="md:hidden mt-3 space-y-2 pb-2">
              <select
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={boutiqueId}
                onChange={(e) => setBoutiqueId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="">Toutes les boutiques</option>
                {boutiques.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-sm">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded"
                />
                En stock uniquement
              </label>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ CONTENU PRINCIPAL ═══════ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ───────── Sidebar filtres (desktop) ───────── */}
          <aside className="hidden md:block w-64 flex-shrink-0 space-y-4">
            {/* Catégories */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Tag size={14} /> Catégories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategoryId('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${!categoryId
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Toutes
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                      ${categoryId == c.id
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {c.nb_produits}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Boutiques */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Store size={14} /> Boutiques
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => setBoutiqueId('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${!boutiqueId
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Toutes
                </button>
                {boutiques.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBoutiqueId(b.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                      ${boutiqueId == b.id
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {b.nb_produits}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stock */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded"
                />
                En stock uniquement
              </label>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium"
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
          </aside>

          {/* ───────── Grille produits ───────── */}
          <main className="flex-1 min-w-0">
            {/* Barre d'info + tri */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-800">{total}</strong> produit
                {total > 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="text-slate-400"> • filtré(s)</span>
                )}
              </p>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-slate-500">Trier par :</span>
                <select
                  value={sortValue}
                  onChange={(e) => setSortValue(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags filtres actifs */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {search && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                    "{search}"
                    <button
                      onClick={() => setSearch('')}
                      className="hover:bg-brand-200 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                {categoryId && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                    {categories.find((c) => c.id == categoryId)?.name}
                    <button
                      onClick={() => setCategoryId('')}
                      className="hover:bg-brand-200 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                {boutiqueId && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                    {boutiques.find((b) => b.id == boutiqueId)?.name}
                    <button
                      onClick={() => setBoutiqueId('')}
                      className="hover:bg-brand-200 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                    En stock
                    <button
                      onClick={() => setInStockOnly(false)}
                      className="hover:bg-brand-200 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Loader / Vide / Grille */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Spinner size={40} />
              </div>
            ) : produits.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-12">
                <EmptyState
                  title="Aucun produit trouvé"
                  message={
                    hasActiveFilters
                      ? 'Essayez de modifier vos filtres ou votre recherche'
                      : 'Le catalogue est vide pour le moment'
                  }
                  icon={Package}
                />
                {hasActiveFilters && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {produits.map((p) => (
                    <ProductCard
                      key={p.id}
                      produit={p}
                      onClick={() => setSelectedProduitId(p.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium
                                 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        if (p > totalPages) return null;
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`min-w-[36px] h-9 rounded-lg text-sm font-medium
                              ${p === page
                                ? 'bg-brand-500 text-white'
                                : 'border border-slate-200 hover:bg-slate-50'}`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium
                                 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} KHAMIS GLOBALE GROUPES — Tous droits réservés
          </p>
        </div>
      </footer>

      {/* ═══════ MODAL DÉTAIL PRODUIT ═══════ */}
      <ProductDetailModal
        open={!!selectedProduitId}
        produitId={selectedProduitId}
        onClose={closeModal}
      />
    </div>
  );
}