// frontend/src/components/forms/ImageGallery.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, '');

function buildImageUrl(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `${BASE_URL}/${filePath.replace(/^\.?\/?/, '')}`;
}

export default function ImageGallery({ images = [], alt = 'Produit' }) {
  const [current, setCurrent] = useState(0);

  // Reset si les images changent
  useEffect(() => {
    setCurrent(0);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-slate-100 flex flex-col items-center justify-center gap-2">
        <ImageIcon size={64} className="text-slate-300" />
        <p className="text-xs text-slate-400">Aucune image</p>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);
  const active = images[current];

  return (
    <div className="space-y-3">
      {/* Image principale */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 group">
        <img
          src={buildImageUrl(active.file_path)}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image précédente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium">
              {current + 1} / {images.length}
            </div>
          </>
        )}
        {active.is_primary === 1 && images.length > 1 && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white rounded-full p-1.5 shadow">
            <Star size={12} fill="currentColor" />
          </div>
        )}
      </div>

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative
                ${i === current
                  ? 'border-brand-500 ring-2 ring-brand-500/30'
                  : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img
                src={buildImageUrl(img.file_path)}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.is_primary === 1 && (
                <div className="absolute top-0.5 right-0.5 bg-amber-500 text-white rounded-full p-0.5">
                  <Star size={8} fill="currentColor" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}