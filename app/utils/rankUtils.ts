import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserData = {
  id: string;
  username: string;
  carbonEmission: number;
  avatar?: string;
};

interface Trip {
  date: string;
  description: string;
  carbonEmission: number;
  distance: number;
}

export const loadAndUpdateRankData = async (): Promise<UserData[]> => {
  try {
    // 获取当日的碳排放强度
    const trips = await AsyncStorage.getItem('recentTrips');
    let todayEmission = 0;
    
    if (trips !== null) {
      const allTrips: Trip[] = JSON.parse(trips);
      const today = new Date().toISOString().split('T')[0];
      
      const todayTrips = allTrips.filter(trip => trip.date === today);
      const totalEmission = todayTrips.reduce((sum: number, trip: Trip) => sum + trip.carbonEmission, 0);
      const totalDistance = todayTrips.reduce((sum: number, trip: Trip) => sum + trip.distance, 0);
      
      todayEmission = totalDistance > 0 ? totalEmission / totalDistance : 0;
      await AsyncStorage.setItem('todayEmissionPerKm', todayEmission.toString());
    }

    // 基础用户数据
    let baseUsers: UserData[] = [
      { id: '1', username: 'Emma', carbonEmission: 2.1, avatar: require('@/assets/images/avatars/avatar1.jpg') },
      { id: '2', username: 'James', carbonEmission: 2.3, avatar: require('@/assets/images/avatars/avatar2.jpg') },
      { id: '3', username: 'Oliver', carbonEmission: 2.5, avatar: require('@/assets/images/avatars/avatar3.jpg') },
      { id: '4', username: 'Sophia', carbonEmission: 2.7, avatar: require('@/assets/images/avatars/avatar4.jpg') },
      { id: '5', username: 'William', carbonEmission: 2.9, avatar: require('@/assets/images/avatars/avatar5.jpg') },
      { id: '6', username: 'Isabella', carbonEmission: 3.1, avatar: require('@/assets/images/avatars/avatar6.jpg') },
      { id: '7', username: 'Henry', carbonEmission: 3.3, avatar: require('@/assets/images/avatars/avatar7.jpg') },
      { id: '8', username: 'Charlotte', carbonEmission: 3.5, avatar: require('@/assets/images/avatars/avatar8.jpg') }
    ];

    baseUsers = baseUsers.filter(user => user.username !== 'lucas77778');
    baseUsers.push({
      id: 'lucas77778',
      username: 'lucas77778',
      carbonEmission: todayEmission,
      avatar: require('@/assets/images/avatar.jpeg')
    });

    await AsyncStorage.setItem('rankUsers', JSON.stringify(baseUsers));
    return baseUsers;
  } catch (error) {
    console.error('Error in loadAndUpdateRankData:', error);
    return [];
  }
};

export const calculateUserRank = async (currentUserEmission: number): Promise<number> => {
  try {
    // 获取所有用户数据
    const savedUsers = await AsyncStorage.getItem('rankUsers');
    if (!savedUsers) return 1; // 如果没有其他用户数据，返回第1名

    const users: UserData[] = JSON.parse(savedUsers);
    
    // 添加当前用户的排放量进行比较
    const allEmissions = users.map(user => user.carbonEmission);
    allEmissions.push(currentUserEmission);
    
    // 对所有排放量进行排序（从低到高）
    const sortedEmissions = [...new Set(allEmissions)].sort((a, b) => a - b);
    
    // 找到当前用户排放量的位置（从1开始计数）
    return sortedEmissions.indexOf(currentUserEmission) + 1;
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 0; // 发生错误时返回0
  }
};

export const updateCurrentUserEmission = async (emission: number) => {
  try {
    const savedUsers = await AsyncStorage.getItem('rankUsers');
    let users: UserData[] = savedUsers ? JSON.parse(savedUsers) : [];
    
    // 查找或添加当前用户
    const currentUserIndex = users.findIndex(user => user.username === 'Lucas77778');
    
    if (currentUserIndex >= 0) {
      // 更新现有用户
      users[currentUserIndex].carbonEmission = emission;
    } else {
      // 添加新用户
      users.push({
        id: 'current_user',
        username: 'Lucas77778',
        carbonEmission: emission,
      });
    }
    
    await AsyncStorage.setItem('rankUsers', JSON.stringify(users));
  } catch (error) {
    console.error('Error updating user emission:', error);
  }
}; 