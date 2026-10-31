// frontend/src/components/data/ExportButtons.jsx
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { rapportsApi } from '../../api/rapports.api';
import toast from 'react-hot-toast';

export default function ExportButtons({ endpoint, params = {}, filenameBase = 'export' }) {
  const download = async (format) => {
    try {
      await rapportsApi.download(
        endpoint,
        { ...params, format },
        `${filenameBase}-${Date.now()}.${format === 'xlsx' ? 'xlsx' : format}`
      );
      toast.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch (err) {
      toast.error('Erreur lors de l\'export');
      console.warn(err);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => download('pdf')}
        title="Export PDF"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium"
      >
        <FileText size={14} /> PDF
      </button>
      <button
        onClick={() => download('xlsx')}
        title="Export Excel"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
      >
        <FileSpreadsheet size={14} /> Excel
      </button>
      <button
        onClick={() => download('svg')}
        title="Export SVG"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
      >
        <Download size={14} /> SVG
      </button>
    </div>
  );
}