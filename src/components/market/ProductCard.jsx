// frontend/src/components/market/ProductCard.jsx
import { ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { formatCFA } from '../../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, '');
const buildImageUrl = (p) =>
  !p ? '' : p.startsWith('http') ? p : `${BASE_URL}/${p.replace(/^\.?\/?/, '')}`;

export default function ProductCard({ produit, onClick }) {
  const outOfStock = produit.stock <= 0;
  const lowStock = produit.stock > 0 && produit.alerte_stock === 1;

  return (
    <button
      type="button"
      onClick={() => onClick?.(produit)}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-400 hover:shadow-lg transition-all duration-300 text-left flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {produit.image_principale ? (
          <img
            src={buildImageUrl(produit.image_principale)}
            alt={produit.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-slate-300" />
          </div>
        )}

        {/* Badge catégorie */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm"
            style={{
              backgroundColor: `${produit.category_color}E6`,
              color: 'white',
            }}
          >
            {produit.category_name}
          </span>
        </div>

        {/* Badge rupture */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg">
              Rupture de stock
            </span>
          </div>
        )}

        {/* Badge stock bas */}
        {lowStock && !outOfStock && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
              <AlertTriangle size={10} /> Stock bas
            </span>
          </div>
        )}

        {/* Multiple images indicator */}
        {produit.images?.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-full">
            {produit.images.length} 📷
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-slate-800 line-clamp-2 min-h-[2.5rem]">
          {produit.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 truncate">
          {produit.boutique_name}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-brand-600">
              {formatCFA(produit.prix_vente)}
            </p>
            <p className="text-[10px] text-slate-400">
              Stock : {produit.stock}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ShoppingCart size={16} />
          </div>
        </div>
      </div>
    </button>
  );
}