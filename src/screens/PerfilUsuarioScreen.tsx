import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Alert,
  Pressable,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import AppHeader from "../components/AppHeader"; // si lo usas en tu proyecto
import { launchImageLibrary } from "react-native-image-picker";

interface Props {
  route: any;
  navigation: any;
}
const GREEN = '#16A34A';
export default function PerfilUsuarioScreen({ route, navigation }: Props) {
  const user = route.params.user;
  console.log("Usuario recibido en PerfilUsuarioScreen:", user);
  // Campos editables
  const [nombre, setNombre] = useState(user.nombre || "");
  const [email, setEmail] = useState(user.email || "");
  const [descripcion, setDescripcion] = useState(user.descripcion || "");
  const [fotoUrl, setFotoUrl] = useState(user.foto_url || "");
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState<any>(null);

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.7,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert("Error", "No se pudo seleccionar la foto");
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) return;

        // Guardar archivo (si lo necesitas para subir)
        setFoto({
          uri: asset.uri,
          name: asset.fileName || "foto.jpg",
          type: asset.type || "image/jpeg",
        });

        // Actualizar la foto mostrada arriba
        setFotoUrl(asset.uri);
      }
    );
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      // JSON al backend en la KEY "body", igual que en el registro
      formData.append(
        "body",
        JSON.stringify({
          dni: user.dni,                // no editable pero requerido
          nombre,
          email,
          password: user.password || "", // backend lo necesita
          telefono: user.telefono || "",
          rolId: user.roles?.[0]?.id || 1,
          descripcion,
        })
      );

      // Foto nueva si el usuario seleccionó
      if (foto) {
        formData.append("foto", foto);
      }

      console.log("FormData enviado:", formData);

      await axios.put(
        `https://geolocalizacion-backend-wtnq.onrender.com/usuarios/${user.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 20000,
        }
      );

      Toast.show({
        type: "success",
        text1: "Perfil actualizado",
      });

      navigation.goBack();
    } catch (error: any) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error al actualizar perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Editar Perfil" showBack />

      <ScrollView contentContainerStyle={styles.container}>
        {/* CAMPOS SOLO INFORMATIVOS */}

        <Text style={styles.label}>DNI</Text>
        <TextInput value={user.dni} editable={false} style={styles.disabled} />

        <Text style={styles.label}>Rol</Text>
        <TextInput
          value={user.roles?.[0]?.nombre || ""}
          editable={false}
          style={styles.disabled}
        />

        {/* CAMPOS EDITABLES */}
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          style={[styles.input, { height: 80 }]}
          multiline
        />

        <Text style={styles.label}>Foto</Text>
        <View style={styles.imageBox}>
          <Image
            source={{
              uri:
                fotoUrl?.trim().length > 0
                  ? fotoUrl
                  : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp",
            }}
            style={styles.previewImage}
          />
        </View>

        <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
          <Text style={styles.changeText}>Seleccionar nueva foto</Text>
        </TouchableOpacity>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={handleUpdate}
        >
          <Text style={styles.saveText}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  disabled: {
    backgroundColor: "#f1f1f1",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    color: "#777",
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },


  imageBox: {
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
  },

  previewImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#2563eb",
  },

  changeBtn: {
    backgroundColor: "#1d4ed8",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },

  changeText: {
    color: "#fff",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    width: "80%",
    borderRadius: 12,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  modalBtn: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,

    shadowColor: GREEN,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryTxt: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
});