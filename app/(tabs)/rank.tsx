import { View, ImageBackground, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RankList from '@/app/components/RankList';

export default function RankScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('@/assets/images/homepage.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover">
        <View style={styles.dimOverlay} />
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <RankList />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 2,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});