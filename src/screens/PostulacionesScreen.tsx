import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Postulacion {
    id: number;
    nombre: string;
    puesto: string;
}

interface Publicacion {
    id: number;
    titulo: string;
    descripcion: string;
}

interface User {
    id: number;
    [key: string]: any;
}

interface PostulacionesScreenProps {
    route: any;
    navigation: any;
}

const API_URL = 'https://geolocalizacion-backend-wtnq.onrender.com'; // reemplaza con tu endpoint real

const PostulacionesScreen: React.FC<PostulacionesScreenProps> = ({ route, navigation }) => {
    const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userString = await AsyncStorage.getItem('user');
                if (userString) {
                    setUser(JSON.parse(userString));
                    fetchPublicaciones(JSON.parse(userString).id); // carga el perfil si hay usuario
                }
            } catch (error) {
                console.log('Error cargando usuario:', error);
            }
        };
        loadUser();
    }, []);

    const fetchPublicaciones = async (userId: number) => {
        try {
            const response = await fetch(`${API_URL}/publicacion/usuario/${userId}`);
            const data = await response.json();
            console.log('Publicaciones obtenidas:', data);
            setPublicaciones(data);
        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar las publicaciones');
        } finally {
            setLoading(false);
        }
    };

const verPostulados = (item: Publicacion) => {
    navigation.navigate("PostulacionesDetalle", {
        publicacionId: item.id,
        titulo: item.titulo,
    });
};


    const renderItem = ({ item }: { item: Publicacion }) => (
        <View style={styles.row}>
            <View style={styles.rowTop}>
                <View style={styles.info}>
                    <Text style={styles.nombre}>{item.titulo}</Text>
                    <Text style={styles.puesto}>{item.descripcion}</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.aceptar]}
                        onPress={() => verPostulados(item)}
                    >
                        <Text style={styles.buttonText}>Ver Postulados</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );



    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AppHeader title="Mis Publicaciones" showBack />
            <FlatList
                data={publicaciones}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

export default PostulacionesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    row: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    nombre: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    puesto: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginLeft: 6,
    },
    aceptar: {
        backgroundColor: '#16a34a',
    },
    rechazar: {
        backgroundColor: '#dc2626',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },

    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
