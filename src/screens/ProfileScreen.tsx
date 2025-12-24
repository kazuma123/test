import { View, Text, StyleSheet, TextInput, Button, ActivityIndicator } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  nombre: string;
  apellido: string;
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
          setUser(JSON.parse(userString));
          fetchProfile(JSON.parse(userString).id); // carga el perfil si hay usuario
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
    if (!user) return alert('Usuario no cargado');
    setSaving(true);
    try {
      const res = await fetch(`https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tituloProfesional: formData.tituloProfesional,
          descripcionProfesional: formData.descripcionProfesional,
          usuario: { id: user.id },
        }),
      });
      if (res.ok) {
        alert('Perfil creado correctamente');
        setHasProfile(true);
        fetchProfile(user.id);
      } else {
        alert('Error al crear perfil');
      }
    } catch (error) {
      console.log(error);
      alert('Error al crear perfil');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return alert('Usuario no cargado');
    setSaving(true);
    try {
      const res = await fetch(`https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tituloProfesional: formData.tituloProfesional,
          descripcionProfesional: formData.descripcionProfesional,
          usuario: { id: user.id },
        }),
      });
      if (res.ok) {
        alert('Perfil actualizado correctamente');
        fetchProfile(user.id);
      } else {
        alert('Error al actualizar perfil');
      }
    } catch (error) {
      console.log(error);
      alert('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Perfil Profesional" showBack />
      <Text style={styles.label}>Título profesional:</Text>
      <TextInput
        style={styles.input}
        value={formData.tituloProfesional}
        onChangeText={(text) => setFormData({ ...formData, tituloProfesional: text })}
        placeholder="Ingrese su título"
      />
      <Text style={styles.label}>Descripción profesional:</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={formData.descripcionProfesional}
        onChangeText={(text) => setFormData({ ...formData, descripcionProfesional: text })}
        placeholder="Ingrese su descripción"
        multiline
      />

      {saving ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : hasProfile ? (
        <Button title="Actualizar perfil" onPress={updateProfile} />
      ) : (
        <Button title="Crear perfil" onPress={saveProfile} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8 },
});
