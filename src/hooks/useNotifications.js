// frontend/src/hooks/useNotifications.js
// Alias vers NotificationContext
import { useNotifications as useNotifsContext } from '../context/NotificationContext';

export function useNotifications() {
  return useNotifsContext();
}