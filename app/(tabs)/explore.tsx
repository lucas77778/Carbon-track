import React, { useState, useRef } from "react";
import { View, ImageBackground, StyleSheet, TouchableOpacity, Text, Modal, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function ExploreScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // 从相册选择图片
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('need album access permission to choose a photo');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      // 这里可以添加上传照片的逻辑
    }
  };

  // 请求相机权限并打开相机
  const openCamera = async () => {
    if (!permission?.granted) {
      const status = await requestPermission();
      if (!status.granted) {
        alert('need camera permission to take a photo');
        return;
      }
    }
    setShowCamera(true);
  };

  // 拍照
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo && photo.uri) {
          setSelectedImage(photo.uri);
          setShowCamera(false);
          // 这里可以添加上传照片的逻辑
        }
      } catch (error) {
        console.log('拍照出错:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/homepage.jpg')}
        style={styles.headerBackground}
        resizeMode="cover">
        <View style={styles.dimOverlay} />
        
        {/* 显示选择的图片 */}
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          </View>
        )}

        {/* 照片上传按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonWrapper} onPress={pickImage}>
            <BlurView intensity={30} tint="dark" style={styles.blur}>
              <MaterialIcons name="photo-library" size={24} color="white" />
              <Text style={styles.buttonText}>choose from album</Text>
            </BlurView>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buttonWrapper} onPress={openCamera}>
            <BlurView intensity={30} tint="dark" style={styles.blur}>
              <MaterialIcons name="camera-alt" size={24} color="white" />
              <Text style={styles.buttonText}>take a photo</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* 相机模态框 */}
      <Modal
        visible={showCamera}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.cameraContainer}>
          {permission?.granted && (
            <CameraView 
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              onCameraReady={() => console.log('相机准备就绪')}
            >
              <View style={styles.cameraButtonContainer}>
                <TouchableOpacity style={styles.cameraButton} onPress={() => setShowCamera(false)}>
                  <Text style={styles.cameraButtonText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
                  <View style={styles.captureButton} />
                </TouchableOpacity>
              </View>
            </CameraView>
          )}
        </View>
      </Modal>
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
  buttonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    zIndex: 2,
  },
  buttonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'white',
  },
  blur: {
    padding: 15,
    width: 150,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  selectedImageContainer: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  selectedImage: {
    width: 250,
    height: 250,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 18,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
});