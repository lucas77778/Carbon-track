import React from 'react';
import { View, ImageBackground, StyleSheet, Text, TouchableOpacity, Image, Animated } from "react-native";
import { useState, useEffect } from "react";
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { calculateUserRank, updateCurrentUserEmission, loadAndUpdateRankData } from '@/app/utils/rankUtils';

const MapComponent = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('getting address...');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('no location permission');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // 获取地理位置信息
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const { region, city, district } = reverseGeocode[0];
          const addressText = `${region || ''} ${city || ''} ${district || ''}`.trim();
          setAddress(addressText || 'failed to get specific address');
        }
      } catch (error) {
        setAddress('address get failed');
      }
    })();
  }, []);

  if (!location) {
    return (
      <>
        <Text style={styles.titleText}>DELIVERY ADDRESS</Text>
        <View style={styles.mapContainer}>
          <BlurView intensity={50} style={StyleSheet.absoluteFill} />
          <Text style={styles.loadingText}>getting location...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Text style={styles.titleText}>DELIVERY ADDRESS</Text>
      <View style={styles.mapContainer}>
        <BlurView intensity={50} style={StyleSheet.absoluteFill} />
        <View style={styles.contentContainer}>
          <MapView
            style={styles.map}
            mapType="hybrid"
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="current location"
            />
          </MapView>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>
      </View>
    </>
  );
};

interface Trip {
  date: string;
  description: string;
  carbonEmission: number;
  distance: number;
}

const CarbonEmissionCard = () => {
  const [todayEmission, setTodayEmission] = useState<number>(0);

  useFocusEffect(
    React.useCallback(() => {
      const updateEmission = async () => {
        try {
          // 更新所有数据
          await loadAndUpdateRankData();
          // 获取更新后的碳排放强度
          const emissionStr = await AsyncStorage.getItem('todayEmissionPerKm');
          if (emissionStr !== null) {
            setTodayEmission(parseFloat(emissionStr));
          }
        } catch (error) {
          console.error('Error updating emission:', error);
        }
      };

      updateEmission();
    }, [])
  );

  return (
    <View style={styles.carbonContainer}>
      <BlurView intensity={50} style={StyleSheet.absoluteFill} />
      <View style={styles.carbonContent}>
        <Text style={styles.carbonTitle}>today carbon intensity</Text>
        <Text style={styles.carbonNumber}>
          {todayEmission.toFixed(2)}<Text style={styles.carbonUnit}>kg/km</Text>
        </Text>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => router.push('/detail')}>
          <Text style={styles.detailButtonText}>view details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const UserStatusCard = () => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [userRank, setUserRank] = useState<number>(0);

  useFocusEffect(
    React.useCallback(() => {
      const updateRankData = async () => {
        try {
          // 首先更新排名数据
          await loadAndUpdateRankData();
          
          // 然后获取更新后的排名
          const savedUsers = await AsyncStorage.getItem('rankUsers');
          if (!savedUsers) {
            setUserRank(0);
            return;
          }

          const users = JSON.parse(savedUsers);
          if (!Array.isArray(users) || users.length === 0) {
            setUserRank(0);
            return;
          }

          const sortedUsers = users.sort((a: any, b: any) => a.carbonEmission - b.carbonEmission);
          const rank = sortedUsers.findIndex((user: any) => user.username === 'lucas77778') + 1;
          setUserRank(rank > 0 ? rank : 0);
        } catch (error) {
          console.error('error loading rank:', error);
          setUserRank(0);
        }
      };

      updateRankData();
    }, [])
  );

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.2,
      useNativeDriver: true,
      friction: 7,
      tension: 40
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 40
    }).start();
  };

  return (
    <View style={styles.userStatusContainer}>
      <BlurView intensity={50} style={StyleSheet.absoluteFill} />
      <View style={styles.userStatusContent}>
        <View style={styles.userInfoSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('@/assets/images/avatar.jpeg')}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.userNameText}>Lucas77778</Text>
        </View>
        <View style={styles.statusSection}>
          <View style={styles.rankingContainer}>
            <Text style={styles.rankingLabel}>my rank</Text>
            <TouchableOpacity 
              style={styles.rankingNumberContainer}
              onPress={() => router.push('/rank')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
            >
              <Animated.Text 
                style={[
                  styles.rankingNumber,
                  { transform: [{ scale: scaleAnim }] }
                ]}
              >
                {userRank || '-'}
              </Animated.Text>
              {userRank > 0 && userRank <= 3 && (
                <MaterialCommunityIcons name="crown" size={24} color="#FFD700" style={styles.crownIcon} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.titleLabel}>my title</Text>
            <View style={styles.titleBadge}>
              <Text style={styles.statusTitleText}>greenhand</Text>
              <MaterialCommunityIcons name="leaf" size={20} color="#4CAF50" style={styles.leafIcon} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('@/assets/images/homepage.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover">
        <View style={styles.dimOverlay} />
        <MapComponent />
        <CarbonEmissionCard />
        <UserStatusCard />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  mapContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  map: {
    width: '100%',
    height: '75%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  addressContainer: {
    height: '25%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingLeft: 5,
  },
  addressText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingText: {
    padding: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  titleText: {
    position: 'absolute',
    top: 85,
    left: 25,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },
  carbonContainer: {
    position: 'absolute',
    top: 390,
    left: 20,
    right: 20,
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  carbonContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carbonTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  carbonNumber: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  carbonUnit: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  userStatusContainer: {
    position: 'absolute',
    top: 590,
    left: 20,
    right: 20,
    height: 160,
    borderRadius: 15,
    overflow: 'hidden',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  userStatusContent: {
    flex: 1,
    padding: 15,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  userNameText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statusSection: {
    flexDirection: 'row',
    flex: 1,
  },
  rankingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  rankingNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingNumber: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  crownIcon: {
    marginLeft: 5,
    marginTop: -15,
  },
  titleLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusTitleText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 5,
  },
  leafIcon: {
    marginLeft: 2,
  },
  rankingClickable: {
    textDecorationLine: 'underline',
    textDecorationColor: '#FFFFFF',
  },
});