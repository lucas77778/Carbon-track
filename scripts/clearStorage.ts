import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearStorage() {
  try {
    await AsyncStorage.clear();
    console.log('Storage successfully cleared!');
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}
