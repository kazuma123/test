// src/hooks/useWorkerSocket.ts
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { getSocket, disconnectSocket } from '../socket/socket';
import axios from 'axios';
import Toast from 'react-native-toast-message';

interface Role {
  id: number;
  nombre: string;
}

interface User {
  id: number;
  roles: Role[];
}

interface NotificacionData {
  empresaNombre: string;
  empresaFoto: string;
  mensaje: string;
  publicacionId: number;
}

export const useWorkerSocket = (user: User | null) => {
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [notifyData, setNotifyData] = useState<NotificacionData | null>(null);

  useEffect(() => {
    if (!user) return;

    const isTrabajador = user.roles.some(r => r.id === 1);
    if (!isTrabajador) return;

    const socket = getSocket();
    socket.connect();

    socket.on('connect', () => {
      socket.emit('join', { userId: user.id });
    });

    socket.on('notificacion', async data => {
      const empresa = await getInfoEmpresa(data.empresaId);

      setNotifyData({
        empresaNombre: empresa.nombre,
        empresaFoto: empresa.foto_url,
        mensaje: data.mensaje,
        publicacionId: data.publicacionId,
      });

      setNotifyVisible(true);
    });

    return () => {
      socket.off('notificacion');
      disconnectSocket();
    };
  }, [user]);

  const enviarPostulacion = async (publicacionId: number) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const payload = {
        trabajadorId: user.id,
        publicacionId,
      };

      console.log("➡️ Enviando postulación:", payload);

      const response = await axios.post(
        'https://geolocalizacion-backend-wtnq.onrender.com/postulaciones',
        payload
      );

      console.log("📌 Respuesta POST:", response.data);

      Toast.show({
        type: 'success',
        text1: '¡Postulación enviada!',
        text2: 'La empresa ha recibido tu solicitud.',
      });

    } catch (error: any) {
      console.error('❌ Error enviando postulación:', error);

      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo enviar la postulación'
      );
    }
  };

  return {
    notifyVisible,
    notifyData,
    setNotifyVisible,
    enviarPostulacion
  };
};

// Utils
async function getInfoEmpresa(empresaId: number | string) {
  try {
    const { data } = await axios.get(
      `https://geolocalizacion-backend-wtnq.onrender.com/usuarios/${empresaId}`
    );
    return {
      foto_url: data?.foto_url ?? '',
      nombre: data?.nombre ?? 'Empresa',
    };
  } catch (error) {
    console.error('Error fetching empresa info:', error);
    return { foto_url: '', nombre: 'Empresa' };
  }
}