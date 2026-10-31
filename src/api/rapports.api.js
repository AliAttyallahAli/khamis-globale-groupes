// frontend/src/api/rapports.api.js
import api from './axios';

export const rapportsApi = {
  // Télécharge un blob à partir d'un endpoint
  download: (endpoint, params, filename) =>
    api
      .get(endpoint, { params, responseType: 'blob' })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }),
};