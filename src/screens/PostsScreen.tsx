import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Alert, TouchableOpacity } from 'react-native';
import AppHeader from '../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../lib/LocationContext';
import axios from 'axios';
import PostuladosModal from '../components/PostulanteModal';

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
    email: string;
    roles: Role[];
}

export default function PostsScreen() {
    const [posts, setPosts] = useState<Post[]>([]);
    const { location } = useLocation();
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [postulantes, setPostulantes] = useState<any[]>([]);
    const [loadingPostulados, setLoadingPostulados] = useState(false);



    // Simular usuario actual
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                if (userString) {
                    const parsed = JSON.parse(userString);
                    console.log("Usuario cargado:", parsed);
                    setUser(parsed);
                }
            } catch (error) {
                console.log("Error cargando usuario:", error);
            }
        };

        loadUser();
    }, []);

    // Ejecutar fetchPosts SOLO cuando user exista
    useEffect(() => {
        if (user?.id) {
            fetchPosts();
        }
    }, [user]);

    const fetchPosts = async () => {
        console.log("Obteniendo publicaciones para usuario ID:", user?.id);
        try {
            const res = await fetch(
                `https://geolocalizacion-backend-wtnq.onrender.com/publicacion/usuario/${user.id}`
            );
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            console.error(error);
        }
    };
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

    const verPostulados = async (publicacionId: number) => {
        setLoadingPostulados(true);

        try {
            const { data } = await axios.get(
                `https://geolocalizacion-backend-wtnq.onrender.com/postulaciones/publicacion/${publicacionId}`
            );

            setPostulantes(data);      // lista de objetos como el que mostraste
            setModalVisible(true);    // abre el modal
        } catch (error) {
            console.error(error);
            Alert.alert(
                'Error',
                'No se pudieron cargar los postulantes'
            );
        } finally {
            setLoadingPostulados(false);
        }
    };


    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Mis publicaciones" showBack />

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <View style={styles.container}>
                        {/* Formulario */}
                        <View style={styles.form}>
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
                                style={[styles.input, styles.textArea]}
                                multiline
                            />

                            <TouchableOpacity style={styles.createButton} onPress={createPost}>
                                <Text style={styles.createButtonText}>Crear publicación</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Header tabla */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, { flex: 2 }]}>Título</Text>
                            <Text
                                style={[
                                    styles.headerCell,
                                    { flex: 2, textAlign: "center" },
                                ]}
                            >
                                Acciones
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.tableRow}>
                        <Text style={[styles.cell, { flex: 2 }]}>{item.titulo}</Text>

                        <View style={[styles.cell, styles.actions]}>
                            <TouchableOpacity
                                style={styles.postuladosBtn}
                                onPress={() => verPostulados(item.id)}
                            >
                                <Text style={styles.actionText}>Postulantes</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => deletePost(item.id)}
                            >
                                <Text style={styles.actionText}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListFooterComponent={
                    <PostuladosModal
                        visible={modalVisible}
                        postulantes={postulantes}
                        onClose={() => setModalVisible(false)}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
        padding: 16,
    },

    /* Formulario */
    form: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 70,
    },
    createButton: {
        backgroundColor: '#2563eb',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },

    /* Tabla */
    table: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e5e7eb',
        paddingVertical: 8,
    },
    headerCell: {
        fontWeight: '700',
        paddingHorizontal: 8,
        fontSize: 13,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 10,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    cell: {
        paddingHorizontal: 8,
        fontSize: 13,
        color: '#333',
    },

    /* Acciones */
    actions: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    postuladosBtn: {
        backgroundColor: '#10b981',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    deleteBtn: {
        backgroundColor: '#ef4444',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

