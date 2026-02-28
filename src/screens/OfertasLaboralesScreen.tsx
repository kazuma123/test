import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Modal,
    ScrollView,
} from 'react-native';
import axios from 'axios';
import AppHeader from '../components/AppHeader';
import OfertasLaboralesScreenDetalle from '../components/OfertasLaboralesScreenDetalle';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: number;
    nombre: string;
    foto_url?: string | null;
}

interface Publicacion {
    id: number;
    titulo: string;
    fecha: string;
    descripcion: string;
    usuario: User;
}

export default function OfertasLaboralesScreen() {
    const [data, setData] = useState<Publicacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOferta, setSelectedOferta] = useState<any>(null);

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
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
        loadUser();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(
                    'https://geolocalizacion-backend-wtnq.onrender.com/publicacion'
                );
                setData(res.data);
            } catch (err) {
                console.log('Error cargando ofertas:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const renderItem = ({ item }: { item: Publicacion }) => (
        <View style={styles.card}>
            <Image
                source={item.usuario.foto_url ? { uri: item.usuario.foto_url } : undefined}
                style={styles.avatar}
            />

            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.titulo}</Text>

                <Text style={styles.company}>
                    {item.usuario.nombre}
                </Text>

                <Text style={styles.date}>
                    {new Date(item.fecha).toLocaleDateString()}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    setSelectedOferta(item);
                    setModalVisible(true);
                }}
            >
                <Text style={styles.buttonText}>Ver detalle</Text>
            </TouchableOpacity>

            {/* MODAL */}
        </View>
    );

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Ofertas Laborales" showBack />

            <FlatList
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.container}
                ListEmptyComponent={
                    !loading && (
                        <Text style={{ textAlign: "center", marginTop: 40 }}>
                            No hay ofertas disponibles
                        </Text>
                    )
                }
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <OfertasLaboralesScreenDetalle
                    publicacion={selectedOferta}
                    onClose={() => setModalVisible(false)}
                    user={user}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        backgroundColor: '#f4f4f4',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 50,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    company: {
        fontSize: 14,
        color: '#555',
    },
    date: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    button: {
        backgroundColor: '#007bff',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
    },
});