import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Button, Alert } from 'react-native';
import AppHeader from '../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../lib/LocationContext';
import axios from 'axios';

interface Role {
    id: number;
    nombre: string;
}
interface Post {
    id: number;
    titulo: string;
    descripcion: string;
    usuarioId: number;
}
interface User {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    roles: Role[];
}

export default function PostsScreen() {
    const [posts, setPosts] = useState<Post[]>([]);
    const { location } = useLocation();
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const ROLE_EMPRESA = 2;

    const isEmpresa = (user?: User): boolean => {
        if (!user || !Array.isArray(user.roles)) return false;
        return user.roles.some((role) => role.id === ROLE_EMPRESA);
    };
    // Simular usuario actual
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                if (userString) {
                    console.log('Usuario cargado desde AsyncStorage:', JSON.parse(userString));
                    setUser(JSON.parse(userString));
                }
            } catch (error) {
                console.log('Error cargando usuario:', error);
            }
        };

        loadUser();
    }, []);

    // Listar publicaciones
    const fetchPosts = async () => {
        try {
            const res = await fetch('https://geolocalizacion-backend-wtnq.onrender.com/publicacion');
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);
    const createPost = async () => {
        if (!titulo || !descripcion) {
            return Alert.alert('Error', 'Todos los campos son obligatorios');
        }

        try {
            const res = await fetch(
                'https://geolocalizacion-backend-wtnq.onrender.com/publicacion',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        titulo,
                        fecha: Date.now(),
                        descripcion,
                        usuarioId: user?.id,
                    }),
                }
            );

            if (!res.ok) {
                Alert.alert('Error', 'No se pudo crear la publicación');
                return;
            }

            // 👉 AQUÍ está el punto clave
            const data = await res.json(); // ← ahora sí tienes el body

            await axios.post(
                'https://geolocalizacion-backend-wtnq.onrender.com/publicacion/notificar',
                {
                    empresaId: user?.id,
                    publicacionId: data.id, // ← ID real del backend
                    lat: location.lat,
                    lng: location.lng,
                    radio: location.radio,
                }
            );

            setTitulo('');
            setDescripcion('');
            fetchPosts();

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error inesperado al crear la publicación');
        }
    };

    const deletePost = async (id: any) => {
        try {
            const res = await fetch(`https://geolocalizacion-backend-wtnq.onrender.com/publicacion/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchPosts(); // actualizar lista
            }
        } catch (error) {
            console.error(error);
        }
    };
    const updatePost = async (id: any, newTitulo: any, newDescripcion: any) => {
        try {
            const res = await fetch(`https://geolocalizacion-backend-wtnq.onrender.com/publicacion/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo: newTitulo, descripcion: newDescripcion }),
            });

            if (res.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <View style={styles.container}>
            <AppHeader title="Mis publicaciones" showBack />

            {/* Formulario Crear */}
            <TextInput
                placeholder="Título"
                value={titulo}
                onChangeText={setTitulo}
                style={styles.input}
            />
            <TextInput
                placeholder="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
                style={styles.input}
            />
            <Button title="Crear publicación" onPress={createPost} />

            {/* Lista de publicaciones */}
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.postItem}>
                        <Text style={styles.postTitle}>{item.titulo}</Text>
                        <Text>{item.descripcion}</Text>
                        <Button title="Eliminar" onPress={() => deletePost(item.id)} />
                        {/* Para actualizar podrías abrir un modal o reutilizar inputs */}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    input: { borderWidth: 1, borderColor: '#ccc', marginVertical: 8, padding: 8, borderRadius: 5 },
    postItem: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginVertical: 6, borderRadius: 5 },
    postTitle: { fontWeight: 'bold', marginBottom: 4 },
});
