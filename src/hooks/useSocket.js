// frontend/src/hooks/useSocket.js
// Alias direct vers le context SocketContext
import { useSocket as useSocketContext } from '../context/SocketContext';

export function useSocket() {
  return useSocketContext();
}

// Hook pour écouter un événement Socket.IO spécifique
import { useEffect } from 'react';

export function useSocketEvent(event, handler) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}