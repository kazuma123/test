import { View, Text, StyleSheet, TextInput, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  nombre: string;
  email: string;
}

export default function ProfileScreen() {
  const [formData, setFormData] = useState({
    tituloProfesional: '',
    descripcionProfesional: '',
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const parsed = JSON.parse(userString);
          setUser(parsed);
          fetchProfile(parsed.id);
        }
      } catch (error) {
        console.log('Error cargando usuario:', error);
      }
    };
    loadUser();
  }, []);

  const fetchProfile = async (userId: number) => {
    try {
      const res = await fetch(`https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/${userId}`);

      if (res.status === 404) {
        setHasProfile(false);
        setFormData({ tituloProfesional: '', descripcionProfesional: '' });
        return;
      }

      const data = await res.json();
      setFormData({
        tituloProfesional: data.tituloProfesional ?? '',
        descripcionProfesional: data.descripcionProfesional ?? '',
      });
      setHasProfile(true);
    } catch (error) {
      console.log('Error al obtener perfil:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return Alert.alert('Usuario no cargado');
    setSaving(true);
    try {
      const res = await fetch(`https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        Alert.alert('Perfil creado correctamente');
        setHasProfile(true);
        fetchProfile(user.id);
      } else {
        Alert.alert('Error al crear perfil');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error al crear perfil');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return Alert.alert('Usuario no cargado');
    setSaving(true);
    try {
      const res = await fetch(`https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        Alert.alert('Perfil actualizado correctamente');
        fetchProfile(user.id);
      } else {
        Alert.alert('Error al actualizar perfil');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Perfil Profesional" showBack />

      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.label}>Título profesional</Text>
        <TextInput
          style={styles.input}
          value={formData.tituloProfesional}
          onChangeText={(text) => setFormData({ ...formData, tituloProfesional: text })}
          placeholder="Ej: Ingeniero de Sistemas"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Descripción profesional</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.descripcionProfesional}
          onChangeText={(text) => setFormData({ ...formData, descripcionProfesional: text })}
          placeholder="Describe tu experiencia, habilidades, logros..."
          placeholderTextColor="#999"
          multiline
        />

        {saving ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 25 }} />
        ) : (
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={hasProfile ? updateProfile : saveProfile}
          >
            <Text style={styles.btnText}>
              {hasProfile ? 'Actualizar perfil' : 'Crear perfil'}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#f9fafb',
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 18,
    color: '#111827',
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111',
  },

  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },

  btnPrimary: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',

    // sombra elegante
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },

  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});