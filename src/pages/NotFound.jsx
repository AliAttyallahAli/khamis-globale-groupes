// frontend/src/pages/NotFound.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icône */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-brand-100 flex items-center justify-center">
          <Compass size={48} className="text-brand-500" />
        </div>

        {/* Code 404 */}
        <h1 className="text-7xl font-black text-brand-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          Page introuvable
        </h2>
        <p className="text-slate-500 mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
                       border border-slate-300 text-slate-700 bg-white hover:bg-slate-50
                       font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
                       bg-brand-500 text-white hover:bg-brand-600 font-medium transition-colors"
          >
            <Home size={16} />
            {isAuthenticated ? 'Tableau de bord' : 'Accueil'}
          </Link>
        </div>

        {!isAuthenticated && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-3">
              Envie de découvrir nos produits ?
            </p>
            <Link
              to="/market"
              className="inline-block px-5 py-2.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-medium transition-colors"
            >
              Voir le catalogue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}