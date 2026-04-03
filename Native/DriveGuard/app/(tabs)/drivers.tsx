import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../store/authStore';
import apiClient from '../../services/api';
import { useRouter } from 'expo-router';
import { convertImageToBase64, getBase64Size } from '../../utils/imageUtils';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1f',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 71, 91, 0.15)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#dfe4fe',
    letterSpacing: 0.5,
  },
  statusIndicatorText: {
    fontSize: 10,
    color: 'rgba(163, 166, 255, 0.6)',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#a5aac2',
    lineHeight: 18,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171f36',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#dfe4fe',
    fontSize: 13,
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1c253e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#3adffa',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 2,
  },
  metricCardLabel: {
    fontSize: 9,
    color: 'rgba(163, 166, 255, 0.6)',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricCardValueCyan: {
    color: '#3adffa',
  },
  metricCardValueGreen: {
    color: '#6dfe9c',
  },
  metricCardValueRed: {
    color: '#ff6e84',
  },
  driversList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  driverCard: {
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.15)',
    overflow: 'hidden',
  },
  driverCardContent: {
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  driverProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(58, 223, 250, 0.2)',
  },
  driverMainInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dfe4fe',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  driverRole: {
    fontSize: 10,
    color: '#3adffa',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  driverStatusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#070d1f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  driverMetrics: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(58, 223, 250, 0.1)',
    borderRadius: 6,
  },
  metricText: {
    fontSize: 10,
    color: '#3adffa',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(109, 254, 156, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(109, 254, 156, 0.2)',
  },
  statusText: {
    fontSize: 9,
    color: '#6dfe9c',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(65, 71, 91, 0.2)',
    paddingTop: 12,
    gap: 12,
  },
  performanceSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 9,
    color: '#6f758b',
    fontWeight: '700',
    letterSpacing: 1,
  },
  performanceChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 60,
  },
  performanceBar: {
    flex: 1,
    backgroundColor: '#a3a6ff',
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#a5aac2',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#dfe4fe',
    fontWeight: '700',
  },
  ratingDurationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(163, 166, 255, 0.1)',
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    color: '#a3a6ff',
    fontWeight: '700',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(58, 223, 250, 0.1)',
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    color: '#3adffa',
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonEdit: {
    backgroundColor: 'rgba(163, 166, 255, 0.1)',
    borderColor: 'rgba(163, 166, 255, 0.3)',
  },
  actionButtonDelete: {
    backgroundColor: 'rgba(255, 110, 132, 0.1)',
    borderColor: 'rgba(255, 110, 132, 0.3)',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButtonTextEdit: {
    color: '#a3a6ff',
  },
  actionButtonTextDelete: {
    color: '#ff6e84',
  },
  centerContent: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#a5aac2',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6f758b',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#a3a6ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#a3a6ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 13, 31, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(65, 71, 91, 0.3)',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dfe4fe',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    color: '#a5aac2',
    fontWeight: '600',
  },
  formInput: {
    backgroundColor: '#171f36',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#dfe4fe',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#a3a6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#070d1f',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#a5aac2',
    fontSize: 14,
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 16,
    gap: 8,
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(58, 223, 250, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePickerButton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1c253e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerButtonText: {
    color: '#3adffa',
    fontSize: 12,
    fontWeight: '600',
  },
  imagePickerOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  imagePickerOption: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(58, 223, 250, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(58, 223, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerOptionText: {
    color: '#3adffa',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default function DriversScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  // React Hook Form for Add Driver
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const ownerId = user?.ownerId;

  const fetchDriversRef = useRef(false);

  // Fetch drivers on mount
  useEffect(() => {
    if (!fetchDriversRef.current && isAuthenticated && token && ownerId) {
      fetchDriversRef.current = true;
      fetchDrivers();
    }
  }, [isAuthenticated, token, ownerId]);

  // Filter drivers based on search
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(
        (driver) =>
          driver.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
          driver.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
          driver.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  }, [searchText, drivers]);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      if (!ownerId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      console.log('🚗 Fetching drivers for owner:', ownerId);
      const response = await apiClient.get('/api/drivers', {
        params: { ownerId }
      });
      if (response.data.success) {
        setDrivers(response.data.data || []);
        setFilteredDrivers(response.data.data || []);
        console.log('✅ Drivers fetched:', response.data.data?.length);
      }
    } catch (error: any) {
      console.error('❌ Error fetching drivers:', error.message);
      Alert.alert('Error', 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDrivers();
    setIsRefreshing(false);
  };

  const handleAddDriver = async () => {
    if (!editFormData.firstName || !editFormData.email || !editFormData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      console.log('➕ Creating driver...');
      const response = await apiClient.post('/api/drivers', editFormData);
      if (response.data.success) {
        Alert.alert('Success', 'Driver added successfully!');
        setEditFormData({ firstName: '', lastName: '', email: '', phone: '', password: '' });
        setIsModalVisible(false);
        await fetchDrivers();
      }
    } catch (error: any) {
      console.error('❌ Error adding driver:', error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add driver');
    }
  };

  const onSubmitNewDriver = async (data: any) => {
    try {
      if (!selectedImage?.assets?.[0]) {
        Alert.alert('Error', 'Please select an image');
        return;
      }

      if (!data.firstName || !data.email || !data.password) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);
      console.log('📝 Submitting new driver:', data.firstName);

      // Convert image to base64
      console.log('🖼️ Converting image to base64...');
      const imageUri = selectedImage.assets[0].uri;
      const base64Image = await convertImageToBase64(imageUri);
      const imageSizeMB = getBase64Size(base64Image);
      console.log(
        `✅ Image converted to base64, size: ${imageSizeMB.toFixed(2)}MB (${base64Image.length} bytes)`
      );

      if (imageSizeMB > 2) {
        Alert.alert(
          'Warning',
          `Image size is ${imageSizeMB.toFixed(2)}MB. Please select a smaller image for better performance.`
        );
        setIsSubmitting(false);
        return;
      }

      // Prepare driver data with base64 image
      const driverData = {
        ownerId,
        firstName: data.firstName,
        lastName: data.lastName || '',
        email: data.email,
        phone: data.phone || '',
        password: data.password,
        profilePhoto: base64Image, // Include base64 encoded image
      };

      console.log('� Driver Data to Send:', {
        firstName: driverData.firstName,
        email: driverData.email,
        phone: driverData.phone,
        hasProfilePhoto: !!driverData.profilePhoto,
        profilePhotoLength: driverData.profilePhoto ? driverData.profilePhoto.length : 0,
        profilePhotoSize: driverData.profilePhoto ? `${(driverData.profilePhoto.length / 1024 / 1024).toFixed(2)}MB` : 'null',
      });

      console.log('�📤 Sending driver data to backend...');
      const response = await apiClient.post('/api/drivers', driverData, {
        params: { ownerId },
        headers: {
          'Content-Type': 'application/json', // Send as JSON
        },
      });

      console.log('✅ Driver created successfully:', response.data);
      Alert.alert('Success', 'Driver added successfully!');

      // Reset form and close modal
      reset();
      setSelectedImage(null);
      setIsModalVisible(false);

      // Refresh driver list
      await fetchDrivers();
    } catch (error: any) {
      console.error('❌ Error adding driver:', error.message);
      console.error('Error details:', error.response?.data);
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to add driver'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission', 'Camera permission is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.4, // Reduced from 0.8 to compress image size significantly
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission', 'Gallery permission is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.4, // Reduced from 0.8 to compress image size significantly
        });
      }

      if (!result.canceled) {
        setSelectedImage(result);
        console.log('✅ Image selected:', result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleEditDriver = (driver: any) => {
    console.log('✏️ Editing driver:', driver._id);
    setEditingDriverId(driver._id);
    setEditFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone || '',
      password: '',
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateDriver = async () => {
    if (!editFormData.firstName || !editFormData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Updating driver:', editingDriverId);
      const response = await apiClient.put(`/api/drivers/${editingDriverId}`, {
        ownerId,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Driver updated successfully!');
        setEditFormData({ firstName: '', lastName: '', email: '', phone: '', password: '' });
        setIsEditModalVisible(false);
        setEditingDriverId(null);
        await fetchDrivers();
      }
    } catch (error: any) {
      console.error('❌ Error updating driver:', error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = (driver: any) => {
    Alert.alert('Delete Driver', `Are you sure you want to delete ${driver.firstName} ${driver.lastName}?`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            console.log('Deleting driver:', driver._id);
            const response = await apiClient.delete(`/api/drivers/${driver._id}`, {
              params: { ownerId }
            });
            if (response.data.success) {
              Alert.alert('Success', 'Driver deleted successfully!');
              await fetchDrivers();
            }
          } catch (error: any) {
            console.error('Error deleting driver:', error.message);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete driver');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getStatusColor = (index: number) => {
    const colors = ['#3adffa', '#6dfe9c', '#a3a6ff', '#ff6e84'];
    return colors[index % colors.length];
  };

  if (!isAuthenticated || !token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <FontAwesome6 name="lock" size={48} color="#00d9ff" />
          <Text style={styles.emptyText}>Authentication required</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1f" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00d9ff"
          />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Personnel Directory</Text>
            <Text style={styles.statusIndicatorText}>System_Status: Operational</Text>
          </View>
          <Text style={styles.subtitle}>
            Real-time monitoring of fleet operators. Tactical data stream synchronized with core protocol.
          </Text>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: '#a3a6ff' }]}>
            <Text style={styles.metricCardLabel}>Active_Units</Text>
            <Text style={[styles.metricCardValue, styles.metricCardValueCyan]}>
              {drivers.length}
            </Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#6dfe9c' }]}>
            <Text style={styles.metricCardLabel}>Safe_Operators</Text>
            <Text style={[styles.metricCardValue, styles.metricCardValueGreen]}>
              {Math.round((drivers.filter(d => d.isActive).length / Math.max(drivers.length, 1)) * 100)}%
            </Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#3adffa' }]}>
            <Text style={styles.metricCardLabel}>In_Transit</Text>
            <Text style={[styles.metricCardValue, styles.metricCardValueCyan]}>
              {drivers.filter(d => d.isActive).length}
            </Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#ff6e84' }]}>
            <Text style={styles.metricCardLabel}>Alerts_Active</Text>
            <Text style={[styles.metricCardValue, styles.metricCardValueRed]}>0{drivers.filter(d => !d.isActive).length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Identify operator..."
              placeholderTextColor="#666"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <FontAwesome6 name="xmark" size={14} color="#666" />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterButton}>
            <FontAwesome6 name="sliders" size={12} color="#3adffa" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </Pressable>
        </View>

        {/* Drivers List */}
        {isLoading && filteredDrivers.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#00d9ff" />
            <Text style={styles.loadingText}>Loading drivers...</Text>
          </View>
        ) : filteredDrivers.length === 0 ? (
          <View style={styles.centerContent}>
            <FontAwesome6 name="user" size={48} color="#444" />
            <Text style={styles.emptyText}>
              {searchText ? 'No drivers found' : 'No drivers available'}
            </Text>
          </View>
        ) : (
          <View style={styles.driversList}>
            {filteredDrivers.map((driver, index) => (
              <Pressable
                key={driver._id}
                style={styles.driverCard}
                onPress={() =>
                  setExpandedId(expandedId === driver._id ? null : driver._id)
                }
              >
                <View style={styles.driverCardContent}>
                  {/* Card Header */}
                  <View style={styles.driverHeader}>
                    {driver.profilePhoto ? (
                      <Image
                        source={{ uri: driver.profilePhoto }}
                        style={styles.driverProfileImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.driverProfileImage,
                          { backgroundColor: getStatusColor(index) },
                        ]}
                      >
                        <FontAwesome6 name="user" size={24} color="#fff" />
                      </View>
                    )}
                    <View style={styles.driverMainInfo}>
                      <Text style={styles.driverName}>
                        {driver.firstName} {driver.lastName}
                      </Text>
                      <Text style={styles.driverRole}>{driver.email}</Text>
                    </View>
                    <View style={styles.driverStatusDot}>
                      <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: driver.isActive ? '#6dfe9c' : '#ff6e84' },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Rating & Duration Row */}
                  <View style={styles.ratingDurationRow}>
                    <View style={styles.ratingBadge}>
                      <FontAwesome6 name="star" size={10} color="#a3a6ff" />
                      <Text style={styles.ratingText}>4.{Math.floor(Math.random() * 10)}/5.0</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <FontAwesome6 name="clock" size={10} color="#3adffa" />
                      <Text style={styles.durationText}>{String(Math.floor(Math.random() * 12)).padStart(2, '0')}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}h Today</Text>
                    </View>
                  </View>

                  {/* Metrics */}
                  <View style={styles.driverMetrics}>
                    <View style={styles.metricBadge}>
                      <FontAwesome6 name="phone" size={10} color="#3adffa" />
                      <Text style={styles.metricText}>{driver.phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <FontAwesome6 name="circle" size={6} color={driver.isActive ? '#6dfe9c' : '#ff6e84'} />
                      <Text style={[styles.statusText, { color: driver.isActive ? '#6dfe9c' : '#ff6e84' }]}>
                        {driver.isActive ? 'NORMAL_PROTOCOL' : 'CAUTION_FLAG'}
                      </Text>
                    </View>
                  </View>

                  {/* Expand Button */}
                  <Pressable
                    style={styles.expandButton}
                    onPress={() =>
                      setExpandedId(expandedId === driver._id ? null : driver._id)
                    }
                  >
                    <FontAwesome6
                      name={expandedId === driver._id ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#a5aac2"
                    />
                  </Pressable>

                  {/* Expanded Content */}
                  {expandedId === driver._id && (
                    <View style={styles.expandedContent}>
                      {/* Performance Section */}
                      <View style={styles.performanceSection}>
                        <Text style={styles.sectionLabel}>Recent_Performance</Text>
                        <View style={styles.performanceChart}>
                          {[...Array(7)].map((_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.performanceBar,
                                { height: `${40 + Math.random() * 60}%` }
                              ]}
                            />
                          ))}
                        </View>
                      </View>

                      {/* Details */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Duty_Limit</Text>
                        <Text style={styles.detailValue}>{70 + Math.floor(Math.random() * 30)}%</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Brake_Health</Text>
                        <Text style={styles.detailValue}>{driver.isActive ? 'Optimum' : 'Alert'}</Text>
                      </View>

                      {/* Action Buttons */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <Pressable
                          style={[styles.actionButton, styles.actionButtonEdit]}
                          onPress={() => handleEditDriver(driver)}
                        >
                          <FontAwesome6 name="pen" size={12} color="#a3a6ff" />
                          <Text style={[styles.actionButtonText, styles.actionButtonTextEdit]}>
                            EDIT
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, styles.actionButtonDelete]}
                          onPress={() => handleDeleteDriver(driver)}
                        >
                          <FontAwesome6 name="trash" size={12} color="#ff6e84" />
                          <Text style={[styles.actionButtonText, styles.actionButtonTextDelete]}>
                            DELETE
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, { backgroundColor: 'rgba(58, 223, 250, 0.1)', borderColor: 'rgba(58, 223, 250, 0.3)' }]}
                          onPress={() => router.push({ pathname: '/assign-vehicle', params: { driverId: driver._id, driverName: `${driver.firstName} ${driver.lastName}` } })}
                        >
                          <FontAwesome6 name="car" size={12} color="#3adffa" />
                          <Text style={[styles.actionButtonText, { color: '#3adffa' }]}>
                            ASSIGN
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
        android_ripple={{ color: 'rgba(58, 223, 250, 0.2)', borderless: true }}
      >
        <FontAwesome6 name="plus" size={28} color="#fff" />
      </Pressable>

      {/* Add Driver Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsModalVisible(false);
          reset();
          setSelectedImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add New Driver</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Section */}
              <View style={styles.imageSection}>
                <Text style={styles.formLabel}>Driver Photo *</Text>
                <View style={styles.imagePreview}>
                  {selectedImage && selectedImage.assets && selectedImage.assets[0] ? (
                    <Image
                      source={{ uri: selectedImage.assets[0].uri }}
                      style={{ width: '100%', height: '100%', borderRadius: 12 }}
                    />
                  ) : (
                    <View style={{ alignItems: 'center', gap: 8 }}>
                      <FontAwesome6 name="image" size={32} color="#a5aac2" />
                      <Text style={{ color: '#a5aac2', fontSize: 12 }}>Select image</Text>
                    </View>
                  )}
                </View>

                <View style={styles.imagePickerOptions}>
                  <Pressable
                    style={styles.imagePickerOption}
                    onPress={() => handlePickImage('camera')}
                    disabled={isSubmitting}
                  >
                    <FontAwesome6 name="camera" size={14} color="#3adffa" />
                    <Text style={styles.imagePickerOptionText}>Camera</Text>
                  </Pressable>
                  <Pressable
                    style={styles.imagePickerOption}
                    onPress={() => handlePickImage('gallery')}
                    disabled={isSubmitting}
                  >
                    <FontAwesome6 name="image" size={14} color="#3adffa" />
                    <Text style={styles.imagePickerOptionText}>Gallery</Text>
                  </Pressable>
                </View>
              </View>

              {/* First Name Field */}
              <Controller
                control={control}
                name="firstName"
                rules={{ required: 'First name is required' }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>First Name *</Text>
                    <TextInput
                      style={[styles.formInput, errors.firstName && { borderColor: '#ff6e84' }]}
                      placeholder="Enter first name"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      editable={!isSubmitting}
                    />
                    {errors.firstName && (
                      <Text style={{ color: '#ff6e84', fontSize: 11, marginTop: 4 }}>
                        {errors.firstName.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Last Name Field */}
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Last Name</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Enter last name"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      editable={!isSubmitting}
                    />
                  </View>
                )}
              />

              {/* Email Field */}
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Email *</Text>
                    <TextInput
                      style={[styles.formInput, errors.email && { borderColor: '#ff6e84' }]}
                      placeholder="Enter email"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isSubmitting}
                    />
                    {errors.email && (
                      <Text style={{ color: '#ff6e84', fontSize: 11, marginTop: 4 }}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Phone Field */}
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Enter phone number"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                      editable={!isSubmitting}
                    />
                  </View>
                )}
              />

              {/* Password Field */}
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Password *</Text>
                    <TextInput
                      style={[styles.formInput, errors.password && { borderColor: '#ff6e84' }]}
                      placeholder="Enter password (min 6 chars)"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry
                      editable={!isSubmitting}
                    />
                    {errors.password && (
                      <Text style={{ color: '#ff6e84', fontSize: 11, marginTop: 4 }}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Pressable
                style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit(onSubmitNewDriver)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#070d1f" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Driver</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setIsModalVisible(false);
                  reset();
                  setSelectedImage(null);
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Driver Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Edit Driver</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>First Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter first name"
                placeholderTextColor="#666"
                value={editFormData.firstName}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, firstName: text })
                }
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter last name"
                placeholderTextColor="#666"
                value={editFormData.lastName}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, lastName: text })
                }
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter email"
                placeholderTextColor="#666"
                value={editFormData.email}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, email: text })
                }
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter phone"
                placeholderTextColor="#666"
                value={editFormData.phone}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, phone: text })
                }
                editable={!isSubmitting}
              />
            </View>

            <Pressable
              style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleUpdateDriver}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#070d1f" />
              ) : (
                <Text style={styles.submitButtonText}>Update Driver</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setIsEditModalVisible(false)}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
