// src/hooks/useWorkerSocket.ts
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { getSocket, disconnectSocket } from '../socket/socket';

interface Role {
  id: number;
  nombre: string;
}

interface User {
  id: number;
  roles: Role[];
}

export const useWorkerSocket = (user: User | null) => {
  useEffect(() => {
    if (!user) return;

    const isTrabajador = user.roles.some(r => r.id === 1);
    if (!isTrabajador) return;

    const socket = getSocket();

    socket.connect();

    socket.on('connect', () => {
      socket.emit('join', { userId: user.id });
    });

    socket.on('notificacion', data => {
      Alert.alert('Nueva notificación', data.mensaje);
    });

    return () => {
      socket.off('notificacion');
      disconnectSocket();
    };
  }, [user]);
};
