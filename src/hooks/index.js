// frontend/src/hooks/index.js — version finale
export { useAuth, useHasRole, useCanAccess } from './useAuth';
export { useRole } from './useRole';
export { useFilters } from './useFilters';
export { usePagination } from './usePagination';
export { useDebounce } from './useDebounce';
export { useModal } from './useModal';
export { useConfirm } from './useConfirm';
export { useToggle } from './useToggle';
export { useLocalStorage } from './useLocalStorage';
export { useFetch } from './useFetch';
export { useApi, clearApiCache } from './useApi';           // ← NOUVEAU
export { useForm } from './useForm';
export { useCountUp } from './useCountUp';
export { useSocket, useSocketEvent } from './useSocket';
export { useNotifications } from './useNotifications';
export { useClickOutside } from './useClickOutside';
export { useKeyboard } from './useKeyboard';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';