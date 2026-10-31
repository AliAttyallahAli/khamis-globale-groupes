// frontend/src/components/forms/ImageUploader.jsx
import { useRef, useState } from 'react';
import { Upload, X, Star, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
// L'API est http://localhost:9000/api → les fichiers sont servis depuis http://localhost:9000/
const BASE_URL = API_URL.replace(/\/api\/?$/, '');

function buildImageUrl(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `${BASE_URL}/${filePath.replace(/^\.?\/?/, '')}`;
}

export default function ImageUploader({
  files = [],                // File[] nouveaux fichiers
  onChange,                  // (File[]) => void
  existingImages = [],       // images déjà en base { id, file_path, is_primary }
  onRemoveExisting,          // (imageId) => Promise
  onSetPrimary,              // (imageId) => Promise
  maxFiles = 10,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const totalCount = files.length + existingImages.length;

  const handleSelect = (incoming) => {
    if (disabled) return;
    const arr = Array.from(incoming);
    const remaining = maxFiles - totalCount;
    if (arr.length > remaining) {
      toast.error(`Maximum ${maxFiles} images au total`);
      return;
    }
    // Filtre types
    const imagesOnly = arr.filter((f) =>
      ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(f.type)
    );
    if (imagesOnly.length !== arr.length) {
      toast.error('Certains fichiers ne sont pas des images valides');
    }
    if (imagesOnly.length > 0) {
      onChange([...files, ...imagesOnly]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleSelect(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Zone de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragOver ? 'border-brand-500 bg-brand-50 scale-[1.02]' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleSelect(e.target.files);
            e.target.value = ''; // permet de re-sélectionner le même fichier
          }}
          disabled={disabled}
        />
        <div className="w-14 h-14 mx-auto rounded-full bg-brand-100 flex items-center justify-center mb-3">
          <Upload size={24} className="text-brand-600" />
        </div>
        <p className="text-sm font-medium text-slate-700">
          Glissez vos images ici ou cliquez
        </p>
        <p className="text-xs text-slate-500 mt-1">
          JPG, PNG, WebP — max 5 MB par image ({totalCount}/{maxFiles})
        </p>
      </div>

      {/* Aperçus */}
      {(existingImages.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {/* Images existantes (déjà en base) */}
          {existingImages.map((img) => (
            <div
              key={`existing-${img.id}`}
              className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
            >
              <img
                src={buildImageUrl(img.file_path)}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.is_primary === 1 && (
                <div className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-1 shadow">
                  <Star size={10} fill="currentColor" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {img.is_primary !== 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSetPrimary?.(img.id); }}
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors"
                    title="Définir comme principale"
                  >
                    <Star size={12} className="text-amber-600" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveExisting?.(img.id); }}
                  className="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors"
                  title="Supprimer"
                >
                  <X size={12} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}

          {/* Nouvelles images (pas encore uploadées) */}
          {files.map((f, i) => (
            <div
              key={`new-${i}`}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-brand-300 bg-slate-100"
            >
              <img
                src={URL.createObjectURL(f)}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                NOUVEAU
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Retirer"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {/* Bouton "Ajouter plus" */}
          {totalCount < maxFiles && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-500"
            >
              <ImagePlus size={20} />
              <span className="text-[10px] font-medium">Ajouter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}