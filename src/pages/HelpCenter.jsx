// frontend/src/pages/HelpCenter.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Search, ChevronRight, HelpCircle, Users, Package,
  ShoppingCart, Receipt, Wallet, FileBarChart2, Settings,
  MessageCircle, Mail, Phone, Lightbulb, PlayCircle,
  FileText, Link as LinkIcon, Download, ExternalLink,
  Video, X, FileQuestion,
} from 'lucide-react';

import { useRole } from '../hooks/useRole';
import { helpApi } from '../api/help.api';
import { formatDate } from '../utils/formatters';

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, '');
const buildFileUrl = (p) =>
  !p ? '' : p.startsWith('http') ? p : `${BASE_URL}/${p.replace(/^\.?\/?/, '')}`;

const CATEGORIES = [
  {
    id: 'demarrage',
    title: 'Démarrage rapide',
    icon: PlayCircle,
    color: 'emerald',
    articles: [
      { title: 'Se connecter pour la première fois', content: 'Utilisez le numéro de téléphone fourni par votre administrateur et le mot de passe associé.' },
      { title: 'Comprendre votre tableau de bord', content: 'Votre tableau de bord affiche les KPIs selon votre rôle : Admin (vue globale), Gérant (ses boutiques), Agent (ses ventes), User (catalogue).' },
      { title: 'Modifier votre profil et mot de passe', content: 'Allez dans "Mon profil" (menu utilisateur en haut à droite) pour modifier vos informations personnelles et votre mot de passe.' },
    ],
  },
  {
    id: 'produits',
    title: 'Gestion des produits',
    icon: Package,
    color: 'blue',
    articles: [
      { title: 'Créer un produit avec double prix', content: "Le prix partenaire (coût d'achat) et le prix de vente sont obligatoires. Le prix de vente doit être ≥ au prix partenaire. La marge unitaire est calculée automatiquement." },
      { title: 'Ajuster le stock', content: "Cliquez sur l'icône 🔄 à côté du produit pour ajuster manuellement le stock (inventaire, perte, etc.)." },
      { title: "Alertes de stock bas", content: "Un badge rouge apparaît quand le stock ≤ seuil d'alerte. Configurez le seuil dans le formulaire du produit." },
      { title: 'Gérer les images produit', content: "Ajoutez jusqu'à 10 images par produit. La première sera automatiquement la principale. Vous pouvez définir une autre image principale ou en supprimer." },
    ],
  },
  {
    id: 'commandes',
    title: 'Commandes & Ventes',
    icon: ShoppingCart,
    color: 'violet',
    articles: [
      { title: 'Créer une commande (Agent)', content: 'Allez sur "Commandes" → "Nouvelle commande". Sélectionnez la boutique, ajoutez les produits et quantités. La commande passe en "En attente".' },
      { title: 'Valider une commande (Gérant)', content: "Cliquez sur l'icône ✅ de la commande. Cette action crée automatiquement une vente, décrémente le stock et calcule la marge." },
      { title: 'Marquer comme livrée', content: "Après validation, cliquez sur l'icône 🚚 pour marquer la commande comme livrée." },
      { title: 'Consulter les ventes', content: 'Allez sur "Ventes" pour voir toutes les ventes avec leur marge calculée. Exportez en PDF/Excel.' },
      { title: 'Enregistrer une vente manuelle', content: 'Sur la page Ventes, cliquez sur "Vendre". Sélectionnez boutique et produits. La vente est validée automatiquement (sans circuit commande).' },
      { title: 'Mes performances (Agent)', content: 'Allez sur "Mes performances" pour analyser vos ventes et marges sur une période donnée. Filtrez par date, recherche ou boutique.' },
    ],
  },
  {
    id: 'personnel',
    title: 'Personnel & Paiements',
    icon: Users,
    color: 'amber',
    articles: [
      { title: 'Ajouter un membre du personnel', content: 'Allez sur "Personnel" → "Nouveau membre". Remplissez les informations et assignez-le à un département et/ou boutique.' },
      { title: 'Enregistrer un paiement', content: 'Cliquez sur 👁 de la fiche personnel → "Enregistrer un paiement". Type, montant, moyen de paiement et justification sont obligatoires.' },
      { title: 'Suivre les paiements', content: 'La page "Paiements personnel" liste tous les paiements avec KPI (salaires, primes, avances). Filtrez par type, moyen ou période.' },
    ],
  },
  {
    id: 'charges',
    title: 'Charges & Dépenses',
    icon: Receipt,
    color: 'red',
    articles: [
      { title: 'Créer une charge', content: 'Allez sur "Charges" → "Nouvelle charge". Type, montant, moyen de paiement et justification (5 car. min.) sont obligatoires.' },
      { title: 'Attacher un justificatif', content: 'Ajoutez une pièce jointe (image ou PDF) pour chaque charge. Elle sera consultable par les admins.' },
      { title: 'Validation des charges', content: 'Les charges créées par un gérant sont en "En attente". Un admin doit les valider ou rejeter avec motif.' },
    ],
  },
  {
    id: 'alkherpay',
    title: 'Paiements AlkherPay',
    icon: Wallet,
    color: 'emerald',
    articles: [
      { title: 'Consulter votre solde AlkherPay', content: 'Allez sur "Portail AlkherPay" → onglet "Solde". Cliquez sur 🔄 pour rafraîchir.' },
      { title: 'Effectuer un transfert', content: 'Onglet "Transfert". Saisissez le numéro du destinataire, le montant et votre PIN à 4 chiffres.' },
      { title: "Voir l'historique", content: "Onglet \"Historique\". Utilisez la recherche pour filtrer par référence ou description." },
    ],
  },
  {
    id: 'rapports',
    title: 'Rapports & Exports',
    icon: FileBarChart2,
    color: 'blue',
    articles: [
      { title: 'Générer un rapport', content: 'Allez sur "Rapports". Choisissez le type (Ventes, Charges, Produits, Personnel), appliquez les filtres et cliquez sur le format (PDF/Excel/SVG).' },
      { title: 'Formats disponibles', content: 'PDF : A4 paysage moderne, idéal pour impression. Excel : analyse de données. SVG : image vectorielle pour intégration.' },
    ],
  },
  {
    id: 'structure',
    title: 'Structure organisationnelle',
    icon: Settings,
    color: 'blue',
    articles: [
      { title: 'Créer une boutique', content: 'Admin → "Boutiques" → "Nouvelle boutique". Assignez une catégorie, un département et un gérant.' },
      { title: 'Gérer les catégories', content: 'Admin → "Catégories". Créez des catégories avec couleur et description pour organiser vos produits.' },
      { title: 'Gérer les départements', content: 'Admin → "Départements". Assignez un responsable (gérant) et rattachez les boutiques.' },
      { title: 'Gérer les utilisateurs', content: 'Admin → "Utilisateurs". Créez, modifiez, activez/désactivez les comptes. Changez les rôles et réinitialisez les mots de passe.' },
      { title: 'Gérer les agents', content: 'Admin → "Agents". Consultez la liste des agents, leurs performances (CA, marge, boutiques) et activez/désactivez un agent.' },
    ],
  },
];

const FAQ = [
  { q: 'Je ne vois pas mes boutiques. Que faire ?', a: 'Vérifiez que votre administrateur vous a bien assigné à au moins une boutique. Si vous êtes agent, vous devez avoir effectué au moins une commande dans la boutique, ou contacter votre admin.' },
  { q: 'Pourquoi je ne peux pas créer un produit ?', a: 'Seuls les administrateurs peuvent créer des produits. Si vous êtes gérant, vous pouvez modifier les produits existants de votre périmètre mais pas les prix (réservés aux admins).' },
  { q: 'Comment sont calculées les marges ?', a: "Marge = (prix de vente − prix partenaire) × quantité. La marge est figée à la validation d'une commande et ne change plus, même si les prix changent." },
  { q: "Je n'arrive pas à me connecter", a: 'Vérifiez votre numéro de téléphone (8 chiffres) et votre mot de passe. Si le problème persiste, contactez votre administrateur pour réinitialiser votre mot de passe.' },
  { q: 'Comment exporter mes données ?', a: 'Rendez-vous sur "Rapports" et cliquez sur le format souhaité (PDF, Excel ou SVG) à côté du rapport concerné.' },
  { q: "Qu'est-ce que le double prix ?", a: "Chaque produit a un prix partenaire (coût d'achat) et un prix de vente. La différence × quantité = votre marge. Obligatoire pour tous les produits." },
  { q: 'Comment ajouter des images à un produit ?', a: "Dans le formulaire produit (création/édition), glissez-déposez vos images ou cliquez sur la zone d'upload. Jusqu'à 10 images, 5 Mo max par image." },
  { q: 'Comment fonctionne la vente manuelle ?', a: 'Sur la page Ventes, cliquez sur "Vendre". La vente est validée automatiquement, le stock est décrémenté et la marge calculée.' },
];

const COLORS = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
};

const RESOURCE_ICONS = {
  guide: FileText,
  video: Video,
  link: LinkIcon,
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

// ═══════════════════════════════════════════════
// COMPOSANT
// ═══════════════════════════════════════════════
export default function HelpCenter() {
  const { isAdmin, isGerant, isAgent, isUser } = useRole();
  const [search, setSearch] = useState('');
  const [openArticle, setOpenArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState('demarrage');
  const [activeTab, setActiveTab] = useState('articles');

  // Ressources dynamiques
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // Modal vidéo
  const [videoModal, setVideoModal] = useState(null);

  // Charge les ressources
  useEffect(() => {
    setLoadingResources(true);
    helpApi
      .resources()
      .then((res) => setResources(res.data || []))
      .catch((err) => {
        console.warn('Erreur chargement ressources:', err);
      })
      .finally(() => setLoadingResources(false));
  }, []);

  // Filtrage articles
  const filteredCategories = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        articles: cat.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.content.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.articles.length > 0),
    [search]
  );

  // Filtrage ressources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resources, search]);

  const guides = filteredResources.filter((r) => r.type === 'guide');
  const videos = filteredResources.filter((r) => r.type === 'video');
  const links = filteredResources.filter((r) => r.type === 'link');

  // Onglets disponibles
  const TABS = [
    { id: 'articles', label: 'Articles', count: filteredCategories.reduce((s, c) => s + c.articles.length, 0) },
    { id: 'guides', label: 'Guides', count: guides.length, icon: FileText },
    { id: 'videos', label: 'Vidéos', count: videos.length, icon: Video },
    { id: 'links', label: 'Liens', count: links.length, icon: LinkIcon },
    { id: 'faq', label: 'FAQ', count: FAQ.length, icon: MessageCircle },
  ];

  // ═══════════════════════════════════════════════
  // Rendu
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-5xl">
      {/* ═══════ EN-TÊTE ═══════ */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="text-brand-500" /> Centre d'aide
          </h1>
          <p className="text-sm text-slate-500">
            Guides, tutoriels, vidéos et ressources pour maîtriser la plateforme
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/help"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
          >
            <Settings size={16} /> Gérer les ressources
          </Link>
        )}
      </div>

      {/* ═══════ RECHERCHE ═══════ */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article, une vidéo, un guide..."
          className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
          >
            <X size={16} className="text-slate-500" />
          </button>
        )}
      </div>

      {/* ═══════ GUIDE PERSONNALISÉ ═══════ */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-xl p-6 text-white">
        <div className="flex items-start gap-3">
          <Lightbulb size={24} className="text-yellow-300 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-lg mb-1">Votre guide personnalisé</h2>
            <p className="text-sm text-white/90 mb-3">
              {isAdmin && 'Vous êtes Administrateur : vous gérez tout le groupe. Consultez d\'abord "Produits", "Boutiques" et "Utilisateurs".'}
              {isGerant && 'Vous êtes Gérant : validez les commandes, gérez votre personnel et lancez les ravitaillements.'}
              {isAgent && 'Vous êtes Agent : créez des commandes, suivez vos ventes et consultez vos marges.'}
              {isUser && 'Vous êtes Utilisateur : consultez le catalogue et les boutiques disponibles.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <>
                  <Link to="/boutiques" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium">
                    <BookOpen size={12} /> Boutiques <ChevronRight size={12} />
                  </Link>
                  <Link to="/utilisateurs" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium">
                    <Users size={12} /> Utilisateurs <ChevronRight size={12} />
                  </Link>
                  <Link to="/admin/agents" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium">
                    <Users size={12} /> Agents <ChevronRight size={12} />
                  </Link>
                </>
              )}
              {isGerant && (
                <>
                  <Link to="/commandes" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium">
                    <ShoppingCart size={12} /> Commandes <ChevronRight size={12} />
                  </Link>
                  <Link to="/personnel" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium">
                    <Users size={12} /> Personnel <ChevronRight size={12} />
                  </Link>
                </>
              )}
              {isAgent && (
                <>
                  <Link to="/commandes" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium">
                    <ShoppingCart size={12} /> Mes commandes <ChevronRight size={12} />
                  </Link>
                  <Link to="/mes-performances" className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-medium">
                    <FileBarChart2 size={12} /> Mes performances <ChevronRight size={12} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ ONGLETS ═══════ */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg transition-colors
                ${isActive
                  ? 'bg-brand-500 text-white font-medium'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                  ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TAB : ARTICLES                              */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'articles' && (
        <>
          {/* Catégories navigation */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                    ${isActive
                      ? 'bg-brand-500 text-white font-medium'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  <Icon size={14} /> {cat.title}
                </button>
              );
            })}
          </div>

          {/* Articles filtrés */}
          {filteredCategories.length === 0 && search ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <FileQuestion size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Aucun article pour "{search}"</p>
            </div>
          ) : (
            filteredCategories
              .filter((cat) => cat.id === activeCategory)
              .map((cat) => {
                const Icon = cat.icon;
                const colorClass = COLORS[cat.color];
                return (
                  <div key={cat.id} className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                        <Icon size={16} />
                      </div>
                      {cat.title}
                    </h2>

                    {cat.articles.map((article, idx) => {
                      const articleId = `${cat.id}-${idx}`;
                      const isOpen = openArticle === articleId;
                      return (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <button
                            onClick={() => setOpenArticle(isOpen ? null : articleId)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                          >
                            <span className="font-medium text-slate-800 text-sm">{article.title}</span>
                            <ChevronRight
                              size={16}
                              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                              {article.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB : GUIDES TÉLÉCHARGEABLES                */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'guides' && (
        <div className="space-y-3">
          {loadingResources ? (
            <div className="py-12 text-center text-slate-500">Chargement des guides...</div>
          ) : guides.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {search ? `Aucun guide pour "${search}"` : 'Aucun guide disponible pour le moment'}
              </p>
              {isAdmin && !search && (
                <Link
                  to="/admin/help"
                  className="inline-block mt-3 px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600"
                >
                  Ajouter un guide
                </Link>
              )}
            </div>
          ) : (
            guides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-800">{guide.title}</h3>
                  {guide.description && (
                    <p className="text-sm text-slate-600 mt-1">{guide.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{formatDate(guide.created_at)}</span>
                    {guide.file_size && (
                      <span>{(guide.file_size / 1024 / 1024).toFixed(2)} Mo</span>
                    )}
                  </div>
                </div>
                <a
                  href={buildFileUrl(guide.file_path)}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 flex-shrink-0"
                >
                  <Download size={14} /> Télécharger
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB : VIDÉOS YOUTUBE                        */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'videos' && (
        <div className="space-y-3">
          {loadingResources ? (
            <div className="py-12 text-center text-slate-500">Chargement des vidéos...</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Video size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {search ? `Aucune vidéo pour "${search}"` : 'Aucune vidéo disponible pour le moment'}
              </p>
              {isAdmin && !search && (
                <Link
                  to="/admin/help"
                  className="inline-block mt-3 px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600"
                >
                  Ajouter une vidéo
                </Link>
              )}
            </div>
          ) : (
            videos.map((video) => {
              const ytId = extractYoutubeId(video.url);
              return (
                <div key={video.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setVideoModal(video)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                      <div className="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                        {ytId ? (
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video size={24} className="text-red-600" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <PlayCircle size={24} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{video.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-red-600 font-medium">
                          <Video size={12} /> Cliquer pour lire
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB : LIENS EXTERNES                        */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'links' && (
        <div className="space-y-3">
          {loadingResources ? (
            <div className="py-12 text-center text-slate-500">Chargement des liens...</div>
          ) : links.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <LinkIcon size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {search ? `Aucun lien pour "${search}"` : 'Aucun lien disponible pour le moment'}
              </p>
              {isAdmin && !search && (
                <Link
                  to="/admin/help"
                  className="inline-block mt-3 px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600"
                >
                  Ajouter un lien
                </Link>
              )}
            </div>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <LinkIcon size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 group-hover:text-brand-600 transition-colors">
                      {link.title}
                    </h3>
                    {link.description && (
                      <p className="text-sm text-slate-600 mt-1">{link.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 truncate">
                      <ExternalLink size={12} /> {link.url}
                    </div>
                  </div>
                  <ExternalLink
                    size={16}
                    className="text-slate-400 group-hover:text-brand-500 flex-shrink-0"
                  />
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB : FAQ                                    */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'faq' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <MessageCircle size={18} className="text-brand-500" />
              Questions fréquentes
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {FAQ.map((item, idx) => {
              const faqId = `faq-${idx}`;
              const isOpen = openArticle === faqId;
              return (
                <div key={idx}>
                  <button
                    onClick={() => setOpenArticle(isOpen ? null : faqId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 text-left"
                  >
                    <span className="text-sm font-medium text-slate-800">{item.q}</span>
                    <ChevronRight
                      size={16}
                      className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-slate-600">{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ CONTACT SUPPORT ═══════ */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
        <h3 className="font-semibold text-brand-900 mb-2">Besoin d'aide supplémentaire ?</h3>
        <p className="text-sm text-brand-700 mb-4">
          Contactez l'équipe support KHAMIS GLOBALE GROUPES
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:support@khamis.com"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-brand-200 text-brand-700 text-sm font-medium hover:bg-brand-100"
          >
            <Mail size={14} /> support@khamis.com
          </a>
          <a
            href="tel:+23562787307"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-brand-200 text-brand-700 text-sm font-medium hover:bg-brand-100"
          >
            <Phone size={14} /> +235 62 78 73 07
          </a>
        </div>
      </div>

      {/* ═══════ MODAL VIDÉO ═══════ */}
      {videoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setVideoModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                          <h3 className="font-semibold text-slate-800">{videoModal.title}</h3>
              <button
                onClick={() => setVideoModal(null)}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {extractYoutubeId(videoModal.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYoutubeId(videoModal.url)}?autoplay=1`}
                  title={videoModal.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
                  <Video size={48} className="text-slate-500" />
                  <p className="text-sm text-slate-400">Impossible de lire cette vidéo</p>
                  <a
                    href={videoModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                  >
                    <ExternalLink size={14} /> Ouvrir dans un nouvel onglet
                  </a>
                </div>
              )}
            </div>
            {videoModal.description && (
              <div className="p-4 text-sm text-slate-600 border-t border-slate-100">
                {videoModal.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}