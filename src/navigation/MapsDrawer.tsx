// src/navigation/MapsDrawer.tsx
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { View, Text, Image } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MapsScreen from '../screens/MapsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostsScreen from '../screens/PostsScreen';

import { useWorkerSocket } from '../context/SocketContext';

const Drawer = createDrawerNavigator();

interface Role {
  id: number;
  nombre: string;
}

interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  foto_url?: string;
  roles: Role[];
}

/* DRAWER PERSONALIZADO */
function CustomDrawerContent({ navigation, user }: any) {
  const isEmpresa = user?.roles?.some((r: Role) => r.id === 2);

  return (
    <DrawerContentScrollView contentContainerStyle={{ flex: 1 }}>
      {/* HEADER */}
      <View style={{ padding: 20, backgroundColor: '#000', alignItems: 'center' }}>
        <Image
          source={{
            uri:
              user?.foto_url ??
              'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
          }}
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10 }}
        />

        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
          {user ? user.nombre : 'Usuario'}
        </Text>
      </View>

      {/* ITEMS */}
      <View style={{ flex: 1, paddingTop: 10 }}>
        <DrawerItem label="Mapa" onPress={() => navigation.navigate('Mapa')} />

        {isEmpresa && (
          <DrawerItem
            label="Mis publicaciones"
            onPress={() => navigation.navigate('MisPublicaciones')}
          />
        )}

        <DrawerItem
          label="Perfil profesional"
          onPress={() => navigation.navigate('Perfil')}
        />
      </View>

      {/* FOOTER */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#eee' }}>
        <DrawerItem
          label="Cerrar sesión"
          labelStyle={{ color: 'red' }}
          onPress={async () => {
            await AsyncStorage.removeItem('user');
            navigation.replace('login');
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

/* DRAWER PRINCIPAL */
export default function MapsDrawer() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        setUser(JSON.parse(userString));
      }
    };
    loadUser();
  }, []);

  // 🔔 SOCKET SOLO PARA TRABAJADOR
  useWorkerSocket(user);

  return (
    <Drawer.Navigator
      drawerContent={props => (
        <CustomDrawerContent {...props} user={user} />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: 280 },
      }}
    >
      <Drawer.Screen name="Mapa" component={MapsScreen} />
      <Drawer.Screen name="MisPublicaciones" component={PostsScreen} />
      <Drawer.Screen name="Perfil" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}
