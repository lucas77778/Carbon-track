import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

// 声明全局类型
declare global {
  var clearStorage: () => Promise<void>;
}

// 添加开发模式下的数据清除功能
if (__DEV__) {
  import('../scripts/clearStorage').then(({ clearStorage }) => {
    // 设置全局变量来访问这个函数
    global.clearStorage = clearStorage;
    console.log('Storage clearing function is ready!');
  });
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const clearStorageOnStartup = async () => {
      if (__DEV__ && global.clearStorage) {
        await global.clearStorage();
        console.log('Storage cleared on startup!');
      }
    };

    clearStorageOnStartup();
  }, []); // 空依赖数组确保只在启动时执行一次

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
