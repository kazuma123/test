// src/screens/MapsScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, Platform, Alert, Image, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { fetchNearby, NearbyItem } from '../services/nearby';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from "socket.io-client";
import { DrawerActions } from '@react-navigation/native';
import { useLocation } from '../lib/LocationContext';
import { fetchUserById } from '../services/user.service';
import { indriveMapStyle } from '../styles/mapStyle';
import Toast from 'react-native-toast-message';
import axios from 'axios';

interface Role {
  id: number;
  nombre: string;
}
interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  tipo: string;
  foto_url?: string;
  roles: Role[];
}
const API_BASE = 'https://geolocalizacion-backend-wtnq.onrender.com';
export default function MapsScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const lastSentRef = useRef<number>(0);
  const [modalVisible, setModalVisible] = useState(false);

  const { location, setLocation } = useLocation();

  const RADIOS = [2, 5, 10, 20, 50];

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<GeoPosition | null>(null);

  const [nearby, setNearby] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const watchIdRef = useRef<number | null>(null);
  const firstFixDoneRef = useRef(false);
  const regionRef = useRef<Region | null>(null);
  const debounceTimerRef = useRef<any | null>(null);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);

  const radioRef = useRef<number>(5);

  const initialRegion: Region = {
    latitude: -12.046374,
    longitude: -77.042793,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<any>(null);

  useEffect(() => {
    const loadUserAndPerfil = async () => {
      try {
        // 1. Cargar usuario desde AsyncStorage
        const userString = await AsyncStorage.getItem('user');

        if (!userString) return;

        const userParsed = JSON.parse(userString);
        console.log('Usuario cargado:', userParsed);
        setUser(userParsed);

        // 2. Obtener userId
        const userId = userParsed.id; // ajusta si tu campo se llama diferente

        // 3. Llamar al endpoint con el userId
        const response = await axios.get(
          `${API_BASE}/perfil-profesional/${userId}`
        );

        console.log('Perfil profesional:', response.data);
        setPerfil(response.data);

      } catch (error) {
        console.log('Error cargando datos:', error);
      }
    };

    loadUserAndPerfil();
  }, []);

  const askPermission = async (): Promise<boolean> => {
    const perm =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const res = await request(perm);
    if (res === RESULTS.GRANTED || res === RESULTS.LIMITED) return true;

    if (res === RESULTS.DENIED || res === RESULTS.BLOCKED) {
      Alert.alert('Permiso de ubicación', 'Actívalo para ver tu ubicación.');
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await askPermission();
      if (!mounted) return;
      setHasPermission(ok);
    })();
    return () => { mounted = false; };
  }, []);

  // ⚠️ Opciones: forzamos LocationManager (estable en emulador)
  const geoOpts = {
    enableHighAccuracy: Platform.OS === 'ios',
    distanceFilter: 10,
    interval: 6000,
    fastestInterval: 3000,
    timeout: 20000,
    maximumAge: 30000,
    forceLocationManager: true,
    showLocationDialog: false,
    forceRequestLocation: true,
  } as const;

  useEffect(() => {
    if (!user?.id) return;

    const roleId = user?.roles?.[0]?.id;
    if (roleId !== 2) return;

    const payload = {
      lat: location.lat,
      lng: location.lng,
      radio: location.radio,
    };

    console.log("📡 Enviando cercanos tiempo real:", payload);

    socket.emit(
      "buscarCercanosTiempoReal",
      payload,
      (resp: any) => {
        console.log("👥 Cercanos RT:", resp);
      }
    );
  }, [location.radio]); // 👈 SOLO CUANDO CAMBIA EL RADIO

  const postularTrabajador = async () => {
    try {
      const response = await axios.post(
        'https://geolocalizacion-backend-wtnq.onrender.com/postulaciones',
        {
          publicacionId: 23,
          trabajadorId: user?.id,
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Postulación enviada',
        text2: 'La postulación se realizó correctamente',
      });

    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo realizar la postulación',
      });
    }
  };

  useEffect(() => {
    if (hasPermission !== true || !mapReady) return;

    let canceled = false;

    watchIdRef.current = Geolocation.watchPosition(
      (pos) => {
        if (canceled) return;

        setPosition(pos);

        setLocation((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));

        const now = Date.now();

        if (now - lastSentRef.current >= 5000 && user?.id) {
          const roleId = user?.roles?.[0]?.id;
          if (!roleId) return;

          const payload = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            radio: radioRef.current,
          };

          switch (roleId) {
            case 1:
              socket.emit("enviarUbicacion", {
                userId: user.id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                foto_url: user.foto_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                tituloProfesional: perfil.tituloProfesional || 'No especificado',
              });
              break;

            case 2:
              socket.emit(
                "buscarCercanosTiempoReal",
                payload,
                (resp: any) => {
                  console.log("👥 Cercanos RT:", resp);
                }
              );
              break;
          }

          lastSentRef.current = now;
        }

        if (!firstFixDoneRef.current && mapRef.current) {
          firstFixDoneRef.current = true;
          mapRef.current.animateCamera(
            {
              center: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              },
              zoom: 16,
            },
            { duration: 600 }
          );
        }
      },
      (err) => console.warn('watchPosition error', err),
      geoOpts
    );

    return () => {
      canceled = true;
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      Geolocation.stopObserving();
    };
  }, [hasPermission, mapReady]);


  const handleLoadUser = async (userId: number) => {
    try {
      setModalVisible(true);
      setLoadingUserId(userId);

      const user = await fetchUserById(userId);

      setSelectedUser({
        id: userId,
        ...user,
      });
    } catch (e) {
      console.warn('Error cargando usuario', e);
    } finally {
      setLoadingUserId(null);
    }
  };




  useEffect(() => {
    // Conectar cuando se monta la pantalla
    socket.connect();

    const handleConnect = () => {
      console.log("🔌 Socket conectado:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("❌ Socket desconectado");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Listeners de datos
    const handleUbicacionActualizada = (data: any) => {
      console.log("📡 Ubicación nueva recibida:", data);
    };

    const handleCercanosActualizados = (lista: any) => {
      setNearby(lista);
      // console.log("👥 Cercanos actualizados:", lista);
    };
    socket.on('connect', () => {
      socket.emit('join', { userId: user?.id }); // ID REAL del trabajador
    });

    socket.on('notificacion', (data) => {
      Toast.show({
        type: 'success',
        text1: 'Confirmar postulación',
        text2: 'Toca aquí para enviar la postulación',
        onPress: () => {
          Toast.hide();
          postularTrabajador();
        },
      });
    });

    socket.on("ubicacionActualizada", handleUbicacionActualizada);
    socket.on("cercanosActualizados", handleCercanosActualizados);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("ubicacionActualizada", handleUbicacionActualizada);
      socket.off("cercanosActualizados", handleCercanosActualizados);
      socket.disconnect(); // cerramos al salir de la pantalla
    };
  }, []);


  const onMapReady = () => setMapReady(true);

  // Debounce al mover el mapa
  const handleSelectRadio = (newRadio: number) => {
    radioRef.current = newRadio;

    setLocation((prev) => ({
      ...prev,
      radio: newRadio,
    }));

    console.log('📍 Radio seleccionado manualmente:', newRadio);
  };



  // Recentrar en mi ubicación
  const onRecenter = () => {
    if (!mapRef.current || !position) return;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    setLocation({
      lat,
      lng,
      radio: 5,
    });

    mapRef.current.animateCamera(
      {
        center: { latitude: lat, longitude: lng },
        zoom: 16,
      },
      { duration: 600 }
    );
  };


  useEffect(() => {
    return () => {
      // cancelar pendientes
      abortRef.current.aborted = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* BOTÓN MENÚ */}
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          zIndex: 100,
          backgroundColor: '#000',
          padding: 12,
          borderRadius: 30,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20 }}>☰</Text>
      </TouchableOpacity>

      {/* MAPA */}
      {hasPermission === true && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onMapReady={onMapReady}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={indriveMapStyle}
        >
          {nearby.map((item) => (
            <Marker
              key={item.userId}
              coordinate={{
                latitude: item.lat,
                longitude: item.lng,
              }}
              onPress={() => handleLoadUser(item.userId)}
            >
              <View style={styles.pinWrap}>
                <View style={styles.pinFallback}>
                  <Text style={styles.pinFallbackTxt}>•</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* BOTÓN CENTRAR */}
      <Pressable style={styles.fabSecondary} onPress={onRecenter}>
        <Text style={styles.fabText}>
          {loadingNearby ? 'Cargando…' : 'Centrar'}
        </Text>
      </Pressable>

      <View style={styles.radioSelector}>
        {RADIOS.map((r) => (
          <Pressable
            key={r}
            onPress={() => handleSelectRadio(r)}
            style={[
              styles.radioBtn,
              location.radio === r && styles.radioBtnActive,
            ]}
          >
            <Text
              style={[
                styles.radioTxt,
                location.radio === r && styles.radioTxtActive,
              ]}
            >
              {r} km
            </Text>
          </Pressable>
        ))}
      </View>


      {/* 👇 AQUÍ VA EL MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {loadingUserId ? (
              <Text style={styles.modalLoading}>
                Cargando usuario…
              </Text>
            ) : selectedUser ? (
              <>
                <Image
                  source={{
                    uri:
                      selectedUser.foto_url ??
                      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                  }}
                  style={styles.modalAvatar}
                />

                <Text style={styles.modalName}>
                  {selectedUser.nombre} {selectedUser.apellido}
                </Text>

                <Text style={styles.modalText}>
                  Email: {selectedUser.email}
                </Text>
                <Text style={styles.modalText}>
                  Tipo: {selectedUser.descripcion}
                </Text>

                <Pressable
                  style={styles.modalClose}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Cerrar
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text>No hay datos</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

}

// Conexión global al socket
const socket = io("https://geolocalizacion-backend-wtnq.onrender.com", {
  transports: ["websocket"],
  autoConnect: false, // lo manejamos manualmente
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Pin con foto circular
  labelWrap: {
    position: 'absolute',
    bottom: 46,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    padding: 6,
    minWidth: 120,
    alignItems: 'center',
  },

  labelContent: {
    alignItems: 'center',
  },

  labelImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginBottom: 4,
  },

  labelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },


  pinWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#16A34A',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinImg: { width: 38, height: 38 },
  pinFallback: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  pinFallbackTxt: { color: '#065F46', fontWeight: '900' },

  fabPrimary: {
    position: 'absolute', right: 16, bottom: 16,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30,
    backgroundColor: '#00C853', elevation: 6,
  },
  fabSecondary: {
    position: 'absolute', right: 16, bottom: 72,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30,
    backgroundColor: '#333', elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700' },




  topMenu: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 20,
  },

  menuBtn: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
  },

  menuBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  dropdown: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 6,
    zIndex: 50,
  },

  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  submitBtn: {
    backgroundColor: '#0A84FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  submitTxt: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },


  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 250,
  },

  modalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: 'center',
    marginBottom: 10,
  },

  modalName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },

  modalSubtitle: {
    marginTop: 10,
    fontWeight: '700',
  },

  modalText: {
    fontSize: 14,
    marginTop: 4,
  },

  modalLoading: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },

  modalClose: {
    marginTop: 20,
    backgroundColor: '#16A34A',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },





  radioSelector: {
    position: 'absolute',
    bottom: 140,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    elevation: 6,
  },

  radioBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginVertical: 4,
    backgroundColor: '#f3f4f6',
  },

  radioBtnActive: {
    backgroundColor: '#16A34A',
  },

  radioTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  radioTxtActive: {
    color: '#fff',
  },

});
