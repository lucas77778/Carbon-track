import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { loadAndUpdateRankData } from '@/app/utils/rankUtils';

type UserData = {
  id: string;
  username: string;
  carbonEmission: number;
  avatar?: string;
};

type RankItem = UserData & {
  rank: number;
};

interface Trip {
  date: string;
  description: string;
  carbonEmission: number;
  distance: number;
}

export default function RankList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadUsers = async () => {
    try {
      const updatedUsers = await loadAndUpdateRankData();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // 添加实时数据更新
  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const getRankedUsers = (): RankItem[] => {
    // 根据碳排放量从低到高排序，并添加排名
    const rankedUsers = users
      .sort((a, b) => a.carbonEmission - b.carbonEmission)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    
    console.log('Ranked users:', rankedUsers.map(user => `${user.username}(${user.rank}): ${user.carbonEmission}`));
    return rankedUsers;
  };

  const renderItem = ({ item, index }: { item: RankItem; index: number }) => {
    const inputRange = [
      -1,
      0,
      (index + 0.5) * 90, // 每个项目的高度加上margin
      (index + 2) * 90
    ];
    
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.8]
    });
    
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0]
    });

    // 添加头像加载错误处理
    const handleImageError = () => {
      console.error(`avatar load failed: ${item.username}`);
    };

    return (
      <Animated.View 
        style={[
          styles.rankItemContainer,
          {
            transform: [{ scale }],
            opacity
          }
        ]}
      >
        <View style={styles.rankItem}>
          <View style={styles.rankNumberContainer}>
            <Text style={[
              styles.rankNumber,
              item.rank <= 3 ? styles.topThree : null
            ]}>
              {item.rank}
            </Text>
            {item.rank <= 3 && (
              <MaterialCommunityIcons 
                name="crown" 
                size={24} 
                color="#FFD700" 
                style={styles.crownIcon} 
              />
            )}
          </View>
          <View style={styles.avatarContainer}>
            <Image 
              source={item.avatar ? item.avatar : require('@/assets/images/avatar.jpeg')}
              style={[
                styles.avatar,
                item.username === 'lucas77778' && styles.currentUserAvatar
              ]}
              onError={handleImageError}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.emission}>{item.carbonEmission.toFixed(2)} kg/km</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>carbon intensity ranking</Text>
      <Animated.FlatList
        data={getRankedUsers()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.listContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  rankItemContainer: {
    marginVertical: 6,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rankNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  topThree: {
    color: '#FFFFFF',
  },
  crownIcon: {
    position: 'absolute',
    top: -12,
    right: -8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentUserAvatar: {
    borderColor: '#4CAF50',
    borderWidth: 2,
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
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emission: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
}); 