import { View, ImageBackground, StyleSheet, TouchableOpacity, Text, ScrollView, TextInput, Modal, Animated, Dimensions, Image, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useCameraPermissions, CameraView, Camera } from 'expo-camera';

interface Trip {
  date: string;
  description: string;
  carbonEmission: number;
  distance: number;
}

interface Vehicle {
  type: string;      // 交通工具类型
  brand: string;     // 品牌
  model: string;     // 型号
  carbonEmission: number; // 碳排放量 (g/km)
  imageUrl?: string; // 图片URL（可选）
}

export default function DetailScreen() {
  const router = useRouter();
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'transport'>('history');
  const fadeAnim = useState(new Animated.Value(1))[0];
  const screenWidth = Dimensions.get('window').width;
  const [newTrip, setNewTrip] = useState<Trip>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    carbonEmission: 0,
    distance: 0
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Vehicle>({
    type: '',
    brand: '',
    model: '',
    carbonEmission: 0,
    imageUrl: ''
  });
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

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

  const handleAddTrip = async () => {
    try {
      const existingTrips = await AsyncStorage.getItem('recentTrips');
      const trips = existingTrips ? JSON.parse(existingTrips) : [];
      
      const updatedTrips = [newTrip, ...trips];
      await AsyncStorage.setItem('recentTrips', JSON.stringify(updatedTrips));
      
      await loadRecentTrips();
      setShowForm(false);
      setNewTrip({
        date: new Date().toISOString().split('T')[0],
        description: '',
        carbonEmission: 0,
        distance: 0
      });
    } catch (error) {
      console.error('Error adding new trip:', error);
    }
  };

  const switchTab = (tab: 'history' | 'transport') => {
    if (tab === activeTab) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const loadVehicles = async () => {
    try {
      const savedVehicles = await AsyncStorage.getItem('vehicles');
      if (savedVehicles !== null) {
        setVehicles(JSON.parse(savedVehicles));
      }
    } catch (error) {
      console.error('加载车辆数据失败:', error);
    }
  };

  const handleAddVehicle = async () => {
    try {
      const updatedVehicles = [newVehicle, ...vehicles];
      await AsyncStorage.setItem('vehicles', JSON.stringify(updatedVehicles));
      setVehicles(updatedVehicles);
      setShowVehicleForm(false);
      setNewVehicle({
        type: '',
        brand: '',
        model: '',
        carbonEmission: 0,
        imageUrl: ''
      });
    } catch (error) {
      console.error('添加车辆失败:', error);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('需要相册访问权限来选择照片');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewVehicle({...newVehicle, imageUrl: result.assets[0].uri});
    }
    setShowImagePicker(false);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const status = await requestPermission();
      if (!status.granted) {
        Alert.alert('权限提示', '需要相机权限来拍照');
        return;
      }
    }
    setShowCamera(true);
    setShowImagePicker(false);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo && photo.uri) {
          setNewVehicle({...newVehicle, imageUrl: photo.uri});
          setShowCamera(false);
        }
      } catch (error) {
        console.log('拍照出错:', error);
      }
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      '选择图片',
      '请选择图片来源',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '拍摄照片',
          onPress: openCamera
        },
        {
          text: '从相册选择',
          onPress: pickImage
        }
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: Trip }) => (
    <View style={styles.tripCard}>
      <Text style={styles.tripDate}>{item.date}</Text>
      <Text style={styles.tripDetails}>{item.description}</Text>
      <View style={styles.tripStats}>
        <Text style={styles.tripStatsText}>碳排放强度: {(item.carbonEmission / item.distance).toFixed(2)} kg/km</Text>
        <Text style={styles.tripStatsText}>距离: {item.distance}km</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {showCamera ? (
        <View style={[styles.cameraContainer, { backgroundColor: 'black' }]}>
          {permission?.granted && (
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Text style={styles.cameraButtonText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.captureButtonContainer}
                  onPress={takePicture}
                >
                  <View style={styles.captureButton} />
                </TouchableOpacity>
              </View>
            </CameraView>
          )}
        </View>
      ) : (
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
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={styles.tabButton}
                onPress={() => switchTab('history')}>
                <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>出行历史</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.tabButton}
                onPress={() => switchTab('transport')}>
                <Text style={[styles.tabText, activeTab === 'transport' && styles.activeTabText]}>我的交通</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
              {activeTab === 'history' && (
                <>
                  <View style={styles.headerContainer}>
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={() => setShowForm(true)}>
                      <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  {recentTrips.map((trip, index) => (
                    <View key={index} style={styles.tripCard}>
                      <Text style={styles.tripDate}>{trip.date}</Text>
                      <Text style={styles.tripDetails}>{trip.description}</Text>
                      <View style={styles.tripStats}>
                        <Text style={styles.tripStatsText}>碳排放强度: {(trip.carbonEmission / trip.distance).toFixed(2)} kg/km</Text>
                        <Text style={styles.tripStatsText}>距离: {trip.distance}km</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {activeTab === 'transport' && (
                <View style={styles.transportContainer}>
                  <TouchableOpacity style={styles.transportCard}>
                    <Image 
                      source={require('@/assets/images/001.png')}
                      style={styles.carImage}
                      resizeMode="contain"
                    />
                    <View style={styles.cardContent}>
                      <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
                        <MaterialCommunityIcons name="car-electric" size={32} color="white" />
                      </View>
                      <Text style={styles.transportTitle}>新能源汽车</Text>
                      <View style={styles.transportDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>品牌型号</Text>
                          <Text style={styles.detailValue}>极氪001</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>碳排放量</Text>
                          <Text style={styles.detailValue}>30g/km</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {vehicles.map((vehicle, index) => (
                    <TouchableOpacity key={index} style={styles.transportCard}>
                      {vehicle.imageUrl && (
                        <Image 
                          source={{ uri: vehicle.imageUrl }}
                          style={styles.carImage}
                          resizeMode="contain"
                        />
                      )}
                      <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
                          <MaterialCommunityIcons name="car-electric" size={32} color="white" />
                        </View>
                        <Text style={styles.transportTitle}>{vehicle.type}</Text>
                        <View style={styles.transportDetails}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>品牌型号</Text>
                            <Text style={styles.detailValue}>{vehicle.brand} {vehicle.model}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>碳排放量</Text>
                            <Text style={styles.detailValue}>{vehicle.carbonEmission}g/km</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity 
                    style={[styles.transportCard, styles.emptyCard]}
                    onPress={() => setShowVehicleForm(true)}
                  >
                    <View style={styles.emptyCardContent}>
                      <Ionicons name="add-circle-outline" size={40} color="#666" />
                      <Text style={styles.emptyCardText}>添加新的交通工具</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          <Modal
            visible={showForm}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowForm(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowForm(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>添加出行记录</Text>
                  <TouchableOpacity onPress={() => setShowForm(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="出行描述"
                  placeholderTextColor="#666"
                  value={newTrip.description}
                  onChangeText={(text) => setNewTrip({...newTrip, description: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="距离（公里）"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={newTrip.distance.toString()}
                  onChangeText={(text) => setNewTrip({...newTrip, distance: parseFloat(text) || 0})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="碳排放量（千克）"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={newTrip.carbonEmission.toString()}
                  onChangeText={(text) => setNewTrip({...newTrip, carbonEmission: parseFloat(text) || 0})}
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setShowForm(false)}>
                    <Text style={styles.buttonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.submitButton]}
                    onPress={handleAddTrip}>
                    <Text style={styles.buttonText}>提交</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal
            visible={showVehicleForm}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowVehicleForm(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>添加出行工具</Text>
                  <TouchableOpacity onPress={() => setShowVehicleForm(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="交通工具类型"
                  placeholderTextColor="#666"
                  value={newVehicle.type}
                  onChangeText={(text) => setNewVehicle({...newVehicle, type: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="品牌"
                  placeholderTextColor="#666"
                  value={newVehicle.brand}
                  onChangeText={(text) => setNewVehicle({...newVehicle, brand: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="型号"
                  placeholderTextColor="#666"
                  value={newVehicle.model}
                  onChangeText={(text) => setNewVehicle({...newVehicle, model: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="碳排放量 (g/km)"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={newVehicle.carbonEmission.toString()}
                  onChangeText={(text) => setNewVehicle({...newVehicle, carbonEmission: parseFloat(text) || 0})}
                />

                <TouchableOpacity 
                  style={styles.imagePickerButton} 
                  onPress={handleImagePicker}
                >
                  <MaterialIcons name="photo-camera" size={24} color="white" />
                  <Text style={styles.imagePickerText}>
                    {newVehicle.imageUrl ? '更换车辆图片' : '添加车辆图片'}
                  </Text>
                </TouchableOpacity>

                {newVehicle.imageUrl && (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: newVehicle.imageUrl }} 
                      style={styles.selectedImagePreview}
                    />
                  </View>
                )}
                
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setShowVehicleForm(false)}>
                    <Text style={styles.buttonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.submitButton]}
                    onPress={handleAddVehicle}>
                    <Text style={styles.buttonText}>添加</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showImagePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowImagePicker(false)}
          >
            <TouchableOpacity 
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowImagePicker(false)}
            >
              <View style={styles.pickerContent}>
                <TouchableOpacity 
                  style={styles.pickerOption}
                  onPress={pickImage}
                >
                  <MaterialIcons name="photo-library" size={24} color="#333" />
                  <Text style={styles.pickerOptionText}>从相册选择</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.pickerOption}
                  onPress={openCamera}
                >
                  <MaterialIcons name="camera-alt" size={24} color="#333" />
                  <Text style={styles.pickerOptionText}>拍摄照片</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.pickerOption, styles.cancelOption]}
                  onPress={() => setShowImagePicker(false)}
                >
                  <Text style={[styles.pickerOptionText, styles.cancelText]}>取消</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </ImageBackground>
      )}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 10,
  },
  addButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  tabButton: {
    marginRight: 20,
    paddingVertical: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  transportContainer: {
    flex: 1,
    padding: 15,
  },
  transportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    width: '100%',
    position: 'relative',
  },
  carImage: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 150,
    height: 100,
  },
  cardContent: {
    width: '60%',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  transportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  transportDetails: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  contentContainer: {
    overflow: 'hidden',
  },
  slidingContent: {
    flex: 1,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#666',
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  imagePickerButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePickerText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedImageContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  selectedImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  cancelOption: {
    backgroundColor: '#666',
  },
  cancelText: {
    color: 'white',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  captureButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  cameraButton: {
    padding: 15,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 18,
  },
});