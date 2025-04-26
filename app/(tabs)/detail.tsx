import { View, ImageBackground, StyleSheet, TouchableOpacity, Text, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface Trip {
  date: string;
  description: string;
  carbonEmission: number;
  distance: number;
}

export default function DetailScreen() {
  const router = useRouter();
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);

  const addSampleTrips = async () => {
    const sampleTrips: Trip[] = [
      {
        date: '2024-03-20',
        description: '地铁通勤',
        carbonEmission: 0.5,
        distance: 8.5
      },
      {
        date: '2024-03-19',
        description: '共享单车',
        carbonEmission: 0,
        distance: 3.2
      },
      {
        date: '2024-03-18',
        description: '开车购物',
        carbonEmission: 2.8,
        distance: 12.5
      },
      {
        date: '2024-03-17',
        description: '公交车旅行',
        carbonEmission: 1.2,
        distance: 15.0
      }
    ];

    try {
      await AsyncStorage.setItem('recentTrips', JSON.stringify(sampleTrips));
      await loadRecentTrips();
    } catch (error) {
      console.error('Error adding sample trips:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const existingTrips = await AsyncStorage.getItem('recentTrips');
      if (!existingTrips) {
        await addSampleTrips();
      } else {
        await loadRecentTrips();
      }
    };
    
    initializeData();
  }, []);

  const loadRecentTrips = async () => {
    try {
      const trips = await AsyncStorage.getItem('recentTrips');
      if (trips !== null) {
        setRecentTrips(JSON.parse(trips));
      }
    } catch (error) {
      console.error('Error loading recent trips:', error);
    }
  };

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
        
        <ScrollView style={styles.recentTripsContainer}>
          <Text style={styles.title}>Outgoing history</Text>
          {recentTrips.map((trip, index) => (
            <View key={index} style={styles.tripCard}>
              <Text style={styles.tripDate}>{trip.date}</Text>
              <Text style={styles.tripDetails}>{trip.description}</Text>
              <View style={styles.tripStats}>
                <Text style={styles.tripStatsText}>碳排放量: {trip.carbonEmission}kg</Text>
                <Text style={styles.tripStatsText}>距离: {trip.distance}km</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 2,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  recentTripsContainer: {
    flex: 1,
    marginTop: 100,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  tripCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  tripDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  tripDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripStatsText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
});