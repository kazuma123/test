import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://geolocalizacion-backend-wtnq.onrender.com';

export interface Postulacion {
    id: number;
    estado: string;
    fechaPostulacion: string;

    publicacion: Publicacion;

    trabajador: Trabajador;
}

export interface Publicacion {
    id: number;
    titulo: string;
    fecha: string;
    descripcion: string | null;
}

export interface Trabajador {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    descripcion: string | null;
    foto_url: string | null;
    dni: string;
    googleAuth: boolean;
    roles: Rol[];
}

export interface Rol {
    id: number;
    nombre: string;
}

interface User {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
}

const PostulacionesDetalleScreen = ({ route }: { route: any }) => {
    const { publicacionId, titulo } = route.params;

    const [loading, setLoading] = useState(true);
    const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPostulacion, setSelectedPostulacion] = useState<Postulacion | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        loadUser();
        fetchPostulaciones();
    }, []);

    const loadUser = async () => {
        try {
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                setUser(JSON.parse(userString));
            }
        } catch (error) {
            console.log('Error cargando usuario:', error);
        }
    };
    const fetchPostulaciones = async () => {
        try {
            const res = await fetch(`${API_URL}/postulaciones/publicacion/${publicacionId}`);
            const data = await res.json();
            setPostulaciones(data);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const postulacionModal = (item: Postulacion) => {
        setSelectedPostulacion(item);
        setModalVisible(true);
    };

const renderItem = ({ item }: { item: Postulacion }) => {
    console.log('Renderizando postulacion:', item);
    const isPendiente = item.estado === "PENDIENTE";
    const isAceptado = item.estado === "ACEPTADO";

    return (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>
                    {item.trabajador.nombre} {item.trabajador.apellido}
                </Text>

                <Text style={styles.email}>{item.trabajador.email}</Text>

                <Text
                    style={[
                        styles.estado,
                        isPendiente && { color: "#eab308" }, // amarillo
                        isAceptado && { color: "#22c55e" } // verde
                    ]}
                >
                    Estado: {item.estado}
                </Text>

                <Text style={styles.fecha}>
                    Fecha: {new Date(item.fechaPostulacion).toLocaleString()}
                </Text>
            </View>

            {isPendiente && (
                <TouchableOpacity
                    style={[styles.button, styles.aceptar]}
                    onPress={() => postulacionModal(item)}
                >
                    <Text style={styles.buttonText}>Aceptar</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    const aceptarPostulante = async (postulacion: Postulacion) => {
        if (!user) {
            console.log('Usuario no cargado');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/postulaciones/${postulacion.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    estado: "ACEPTADO",
                    empresaId: user.id,
                }),
            });

            if (!response.ok) {
                throw new Error("Error al aceptar la postulación");
            }

            alert("Éxito", "La postulación fue aceptada correctamente");
            fetchPostulaciones();
        } catch (error) {
            console.log('Error aceptando postulante:', error);
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader title={`${titulo}`} showBack />

            <FlatList
                data={postulaciones}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
            />

            {/* MODAL */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Aceptar Postulante</Text>

                        {selectedPostulacion && (
                            <Text style={styles.modalText}>
                                ¿Aceptar a {selectedPostulacion.trabajador.nombre} {selectedPostulacion.trabajador.apellido} para este puesto?
                            </Text>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalAceptar]}
                                onPress={() => {
                                    setModalVisible(false);
                                    aceptarPostulante(selectedPostulacion!);
                                }}
                            >
                                <Text style={styles.modalBtnText}>Confirmar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalCancelar]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default PostulacionesDetalleScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    row: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
    },
    nombre: { fontSize: 16, fontWeight: '600', color: '#111' },
    email: {
        fontSize: 13,
        color: "#4b5563",
        marginTop: 2
    },

    estado: {
        marginTop: 6,
        fontSize: 12,
        color: "#2563eb",
        fontWeight: "600",
    },

    fecha: {
        marginTop: 3,
        fontSize: 12,
        color: "#6b7280",
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginLeft: 6,
    },
    aceptar: { backgroundColor: '#16a34a' },
    buttonText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // MODAL
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        elevation: 10,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
    modalText: { fontSize: 15, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    modalBtn: {
        flex: 1,
        marginHorizontal: 5,
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    modalAceptar: { backgroundColor: '#16a34a' },
    modalCancelar: { backgroundColor: '#dc2626' },
    modalBtnText: { color: '#fff', fontWeight: '600' },
});