// frontend/src/utils/constants.js
export const ROLES = {
  admin: { label: 'Administrateur', color: 'violet' },
  gerant: { label: 'Gérant', color: 'blue' },
  agent: { label: 'Agent', color: 'emerald' },
  user: { label: 'Utilisateur', color: 'slate' },
};

export const STATUTS_COMMANDE = {
  en_attente: { label: 'En attente', color: 'amber' },
  validee: { label: 'Validée', color: 'emerald' },
  livree: { label: 'Livrée', color: 'blue' },
  annulee: { label: 'Annulée', color: 'red' },
};

export const MOYENS_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'carte', label: 'Carte' },
  { value: 'alkherpay', label: 'AlkherPay' },
];

export const TYPES_CHARGE = [
  'loyer', 'transport', 'electricite', 'eau', 'internet', 'telephone',
  'fournitures', 'maintenance', 'salaires', 'marketing', 'taxes', 'divers',
];

export const TYPES_PAIEMENT = [
  { value: 'salaire', label: 'Salaire' },
  { value: 'prime', label: 'Prime' },
  { value: 'avance', label: 'Avance' },
  { value: 'autre', label: 'Autre' },
];

export const STATUTS_CHARGE = {
  en_attente: { label: 'En attente', color: 'amber' },
  validee: { label: 'Validée', color: 'emerald' },
  rejetee: { label: 'Rejetée', color: 'red' },
};

export const STATUTS_PERSONNEL = {
  actif: { label: 'Actif', color: 'emerald' },
  suspendu: { label: 'Suspendu', color: 'amber' },
  sorti: { label: 'Sorti', color: 'slate' },
};