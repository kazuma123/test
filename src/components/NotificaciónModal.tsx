import { Modal, View, Text, Image, TouchableOpacity } from 'react-native';

type NotificacionData = {
  empresaFoto?: string;
  empresaNombre?: string;
  mensaje?: string;
} | null;

interface Props {
  visible: boolean;
  data?: NotificacionData;
  onClose: () => void;
  onAccept: () => void;
}

export default function NotificacionModal({ visible, data, onClose, onAccept }: Props) {
  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
        
        <View style={{ backgroundColor:'white', padding:20, borderRadius:10, width:'80%' }}>

          <Image 
            source={{ uri: data.empresaFoto }}
            style={{ width: 80, height: 80, borderRadius: 40, alignSelf:'center', marginBottom: 10 }}
          />

          <Text style={{ fontSize: 18, fontWeight:'bold', textAlign:'center' }}>
            {data.empresaNombre}
          </Text>

          <Text style={{ textAlign:'center', marginVertical:10 }}>
            {data.mensaje}
          </Text>

          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:20 }}>
            
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color:'red', fontWeight:'bold' }}>CANCELAR ❌</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onAccept}>
              <Text style={{ color:'green', fontWeight:'bold' }}>POSTULAR ✅</Text>
            </TouchableOpacity>

          </View>

        </View>

      </View>
    </Modal>
  );
}