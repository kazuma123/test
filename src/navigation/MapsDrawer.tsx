import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MapsScreen from '../screens/MapsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostsScreen from '../screens/PostsScreen';
import OfertasLaboralesScreen from '../screens/OfertasLaboralesScreen';

import { useWorkerSocket } from '../context/SocketContext';
import PostulacionesDetalleScreen from '../screens/OfertasLaboralesScreen';
import NotificacionModal from '../components/NotificaciónModal';
import axios from 'axios';
import PerfilUsuarioScreen from '../screens/PerfilUsuarioScreen';
// import Icon from 'react-native-vector-icons/Ionicons';

const Drawer = createDrawerNavigator();

interface Role {
  id: number;
  nombre: string;
}

interface User {
  id: number;
  nombre: string;
  email: string;
  foto_url?: string;
  descripcion: string;
  telefono?: string;
  roles: Role[];
  rating?: number; // ⭐ reputación (ej: 4.7)
}

function RatingStars({ rating = 5 }: { rating?: number }) {
  const fullStars = Math.floor(rating);

  return (
    <View style={styles.starsContainer}>
      {[...Array(5)].map((_, i) => (
        <Text key={i} style={styles.star}>
          {i < fullStars ? '★' : '☆'}
        </Text>
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

/* ===============================
   DRAWER PERSONALIZADO
================================ */
function CustomDrawerContent({
  navigation,
  user,
}: DrawerContentComponentProps & { user: User | null; tienePerfil?: boolean | null }) {
  const isEmpresa = user?.roles?.some(r => r.id === 2);

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      {/* CARD HEADER */}
      <View style={styles.profileCard}>
        <Image
          source={{
            uri:
              user?.foto_url ??
              'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
          }}
          style={styles.avatar}
        />

        <Text style={styles.name}>
          {user ? `${user.nombre}` : 'Usuario'}
        </Text>

        <RatingStars rating={user?.rating ?? 4.8} />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isEmpresa ? 'Empresa' : 'Trabajador'}
          </Text>
        </View>
      </View>

      {/* MENU */}
      <View style={styles.menu}>
        <DrawerItem
          label="Mapa"
          labelStyle={styles.label}
          onPress={() => navigation.navigate('Mapa')}
        />

        <DrawerItem
          label="Perfil usuario"
          labelStyle={styles.label}
          onPress={() => navigation.navigate("PerfilUsuario", { user })}
        />

        {isEmpresa && (
          <DrawerItem
            label="Mis publicaciones"
            labelStyle={styles.label}
            onPress={() => navigation.navigate('MisPublicaciones')}
          />
        )}

        {!isEmpresa && (
          <DrawerItem
            label="Perfil profesional"
            labelStyle={styles.label}
            onPress={() => navigation.navigate('Perfil')}
          />
        )}

        {!isEmpresa && (
          <DrawerItem
            label="Ofertas laborales"
            labelStyle={styles.label}
            onPress={() => navigation.navigate('OfertasLaborales')}
          />
        )}

        <View
          style={{
            height: 1,
            backgroundColor: '#ccc',
            marginVertical: 12,
            marginHorizontal: 16,
          }}
        />

        <DrawerItem
          label="Cerrar sesión"
          labelStyle={styles.logout}
          onPress={async () => {
            await AsyncStorage.removeItem('user');
            navigation.navigate('login');
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

/* ===============================
   DRAWER PRINCIPAL
================================ */
export default function MapsDrawer() {
  const [user, setUser] = useState<User | null>(null);
  const [tienePerfil, setTienePerfil] = useState<boolean | null>(null);

useEffect(() => {
  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const parsed = JSON.parse(storedUser);
      const res = await fetch(
        `https://geolocalizacion-backend-wtnq.onrender.com/usuarios/${parsed.id}`
      );
      const fullUser = await res.json();
      console.log("Usuario cargado:", fullUser);
      setUser(fullUser);
    } catch (error) {
      console.log("Error cargando usuario:", error);
    }
  };

  loadUser();
}, []);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await axios.get(
          `https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/${user?.id}`
        );
        setTienePerfil(res.data && res.data.id ? true : false);
      } catch (err) {
        setTienePerfil(false);
      }
    };

    if (user?.id) fetchPerfil();
  }, [user]);

  const {
    notifyVisible,
    notifyData,
    setNotifyVisible,
    enviarPostulacion
  } = useWorkerSocket(user);

  return (
    <>
      <NotificacionModal
        visible={notifyVisible}
        data={notifyData}
        onClose={() => setNotifyVisible(false)}
        onAccept={() => {
          if (!notifyData) return;
          enviarPostulacion(notifyData.publicacionId);
          setNotifyVisible(false);
        }}
      />
      <Drawer.Navigator
        drawerContent={props => (
          <CustomDrawerContent {...props} user={user} tienePerfil={tienePerfil} />
        )}
        screenOptions={{
          headerShown: false,
          drawerStyle: styles.drawer,
          drawerType: 'front',
          overlayColor: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <Drawer.Screen name="Mapa" component={MapsScreen} />
        <Drawer.Screen name="MisPublicaciones" component={PostsScreen} />
        <Drawer.Screen name="Perfil" component={ProfileScreen} />
        <Drawer.Screen name="OfertasLaborales" component={OfertasLaboralesScreen} />
        <Drawer.Screen name="PostulacionesDetalle" component={PostulacionesDetalleScreen} />
        <Drawer.Screen name="PerfilUsuario" component={PerfilUsuarioScreen} />
      </Drawer.Navigator>
    </>
  );
}

/* ===============================
   STYLES
================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 12,
  },
  drawer: {
    width: 300,
    backgroundColor: '#F2F3F7',
  },
  profileCard: {
    margin: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#4F46E5', // indrive-like accent
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111827',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  star: {
    fontSize: 18,
    color: '#FACC15',
    marginHorizontal: 1,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  badge: {
    marginTop: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  menu: {
    flex: 1,
    paddingTop: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logout: {
    color: '#DC2626',
    fontWeight: '600',
  },
});