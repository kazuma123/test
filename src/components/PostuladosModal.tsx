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

interface Props {
  visible: boolean;
  postulados: any[];
  onClose: () => void;
}

const PostuladosModal: React.FC<Props> = ({
  visible,
  postulados,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Postulados</Text>

          <FlatList
            data={postulados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Image
                  source={{ uri: item.trabajador.foto_url }}
                  style={styles.avatar}
                />

                <View style={styles.info}>
                  <Text style={styles.name}>
                    {item.trabajador.nombre} {item.trabajador.apellido}
                  </Text>

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
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No hay postulados</Text>
            }
          />

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
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    fontSize: 14,
  },
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
