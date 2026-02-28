import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";

export default function OfertasLaboralesScreenDetalle({ publicacion, onClose, user }: any) {
  const [yaPostulado, setYaPostulado] = useState(false);
  const [estadoPostulacion, setEstadoPostulacion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 👉 Verifica si el usuario ya se postuló y obtiene el estado
  useEffect(() => {
    const checkPostulacion = async () => {
      try {
        const { data } = await axios.get(
          `https://geolocalizacion-backend-wtnq.onrender.com/postulaciones/publicacion/${publicacion.id}`
        );

        const postulacionUsuario = data.find(
          (p: any) => p.trabajador?.id === user?.id
        );

        if (postulacionUsuario) {
          setYaPostulado(true);
          setEstadoPostulacion(postulacionUsuario.estado);
        }
      } catch (error) {
        console.log("Error verificando postulación:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPostulacion();
  }, [publicacion]);

  const handlePostular = async () => {
    try {
      await axios.post(
        "https://geolocalizacion-backend-wtnq.onrender.com/postulaciones",
        {
          publicacionId: publicacion.id,
          trabajadorId: user?.id,
        }
      );

      Toast.show({
        type: "success",
        text1: "¡Postulación enviada!",
        text2: "La empresa recibirá tu solicitud.",
      });

      setYaPostulado(true);
      setEstadoPostulacion("PENDIENTE");
      onClose();
      
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error al postular",
        text2: err?.response?.data?.message || "No se pudo enviar la postulación",
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.modalBackground}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modalBackground}>
      <View style={styles.modalContent}>
        
        {/* CERRAR */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* FOTO */}
        <Image
          source={{ uri: publicacion.usuario.foto_url }}
          style={styles.avatar}
        />

        <Text style={styles.title}>{publicacion.titulo}</Text>

        <Text style={styles.company}>
          {publicacion.usuario.nombre}
        </Text>

        <Text style={styles.date}>
          Publicado el {new Date(publicacion.fecha).toLocaleDateString()}
        </Text>

        <Text style={styles.desc}>{publicacion.descripcion}</Text>

        {/* BOTÓN POSTULAR */}
        {yaPostulado ? (
          <>
            <View style={[styles.button, styles.disabledButton]}>
              <Text style={styles.buttonText}>Ya postulaste</Text>
            </View>

            {/* ➤ ESTADO */}
            {estadoPostulacion && (
              <Text style={styles.estado}>
                Estado actual: <Text style={styles.estadoBold}>{estadoPostulacion}</Text>
              </Text>
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handlePostular}>
            <Text style={styles.buttonText}>Postular</Text>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#eee",
    padding: 6,
    borderRadius: 20,
  },
  closeText: { fontSize: 16, fontWeight: "700" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  company: { textAlign: "center", fontSize: 16, marginTop: 5 },
  date: { textAlign: "center", color: "#666", marginTop: 5 },
  desc: { marginTop: 20, fontSize: 15, lineHeight: 20 },

  button: {
    backgroundColor: "#28a745",
    marginTop: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  buttonText: { textAlign: "center", color: "#fff", fontSize: 16 },

  estado: {
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
    color: "#444",
  },
  estadoBold: {
    fontWeight: "700",
    color: "#000",
  },
});