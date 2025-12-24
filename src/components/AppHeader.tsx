import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  DrawerActions,
  useNavigation,
} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  title: string;
  showBack?: boolean; // flecha o menú
}

export default function AppHeader({ title, showBack = false }: Props) {
  const navigation = useNavigation();

  const onPressLeft = () => {
    if (showBack) {
      navigation.goBack();
    } else {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressLeft} style={styles.left}>
        <Ionicons
          name={showBack ? 'arrow-back' : 'menu'}
          size={26}
          color="#000"
        />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {/* Espacio para centrar el título */}
      <View style={styles.right} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    paddingHorizontal: 12,
  },
  left: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  right: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});
