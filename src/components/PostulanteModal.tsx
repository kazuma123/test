import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';

interface Props {
  visible: boolean;
  postulantes: any[];
  onClose: () => void;
}

const PostuladosModal: React.FC<Props> = ({
  visible,
  postulantes,
  onClose,
}) => {

  const handleAceptar = async (trabajadorId: number, postulacionId:number) => {
    console.log('Aceptar postulante ID:', trabajadorId, 'Postulación ID:', postulacionId);
    try {
      await axios.patch(
        `https://geolocalizacion-backend-wtnq.onrender.com/postulaciones/${postulacionId}`,
        {
          estado: 'ACEPTADO',
          empresaId: trabajadorId,
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Postulante aceptado',
      });

      onClose();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error al aceptar',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Postulantes</Text>

          <FlatList
            data={postulantes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const idPostulacion = item.id;
              const trabajador = item.trabajador;

              return (
                <View style={styles.row}>
                  {/* FOTO CENTRADA */}
                  <Image
                    source={{ uri: trabajador.foto_url }}
                    style={styles.avatar}
                  />

                  <View style={styles.info}>
                    {/* NOMBRE */}
                    <Text style={styles.name}>{trabajador.nombre}</Text>

                    {/* ESTADO + FECHA + BOTÓN */}
                    <View style={styles.actionRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.estadoBase,
                            item.estado === 'ACEPTADO'
                              ? styles.estadoAceptado
                              : item.estado === 'RECHAZADO'
                              ? styles.estadoRechazado
                              : styles.estadoPendiente,
                          ]}
                        >
                          {item.estado}
                        </Text>

                        <Text style={styles.date}>
                          {new Date(item.fechaPostulacion).toLocaleDateString()}
                        </Text>
                      </View>

                      {item.estado === 'PENDIENTE' ? (
                        <TouchableOpacity
                          style={styles.acceptBtnSmall}
                          onPress={() => handleAceptar(trabajador.id, idPostulacion)}
                        >
                          <Text style={styles.acceptTextSmall}>Aceptar</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.alreadyAcceptedSmall}>✔</Text>
                      )}
                    </View>

                    {/* TELÉFONO DESTACADO */}
                    <Text style={styles.phone}>📞 {trabajador.telefono}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>No hay postulantes</Text>
            }
          />

          {/* CERRAR */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PostuladosModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    maxHeight: '85%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center', // FOTO CENTRADA VERTICAL
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    fontSize: 15,
  },

  /* ESTADOS */
  estadoBase: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  estadoAceptado: {
    color: '#10b981',
  },
  estadoRechazado: {
    color: '#ef4444',
  },
  estadoPendiente: {
    color: '#f59e0b',
  },

  date: {
    fontSize: 11,
    color: '#6b7280',
  },

  phone: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },

  /* FILA PARA ESTADO, FECHA y BOTÓN */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  /* BOTÓN PEQUEÑO */
  acceptBtnSmall: {
    backgroundColor: '#16a34a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  acceptTextSmall: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  alreadyAcceptedSmall: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 6,
  },

  closeBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },

  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6b7280',
  },
});