import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MapsDrawer from './src/navigation/MapsDrawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocationProvider } from './src/lib/LocationContext';

type RootStackParamList = {
  login: undefined;
  maps: undefined;
  register: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <LocationProvider>
          <Stack.Navigator initialRouteName="login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="maps" component={MapsDrawer} />
            <Stack.Screen name="register" component={RegisterScreen} />
          </Stack.Navigator>
        </LocationProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

