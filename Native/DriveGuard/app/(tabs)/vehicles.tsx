import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import useVehicleStore from '../../store/vehicleStore';
import useAuthStore from '../../store/authStore';
import { useRouter } from 'expo-router';
import apiClient from '../../services/api';

interface VehicleCardProps {
  vehicle: any;
  isExpanded: boolean;
  onPress: () => void;
}

// Styles definition (before components to avoid "used before declaration" errors)
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
    borderLeftColor: '#a3a6ff',
  },
  metricLabel: {
    fontSize: 9,
    color: 'rgba(163, 166, 255, 0.6)',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a3a6ff',
  },
  metricValueCyan: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3adffa',
  },
  metricValueGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6dfe9c',
  },
  metricValueRed: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff6e84',
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
  searchIcon: {
    marginRight: 8,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 110, 132, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6e84',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#ff9898',
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
  vehiclesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.15)',
    overflow: 'hidden',
  },
  vehicleCardContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(58, 223, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleMainInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dfe4fe',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vehicleName: {
    fontSize: 12,
    color: '#a5aac2',
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(58, 223, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleMetrics: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(65, 71, 91, 0.3)',
    paddingTop: 16,
    marginTop: 12,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(28, 37, 62, 0.3)',
    borderRadius: 8,
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
  graphContainer: {
    backgroundColor: 'rgba(28, 37, 62, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  graphBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 8,
    flex: 1,
    width: '100%',
  },
  bar: {
    width: '25%',
    backgroundColor: '#a3a6ff',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 8,
    color: '#a5aac2',
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#ff6e84',
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f1728',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 71, 91, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dfe4fe',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 16,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    color: '#a3a6ff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: '#171f36',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#dfe4fe',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#a3a6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#070d1f',
    letterSpacing: 0.5,
  },
});

const VehicleCard = ({ vehicle, isExpanded, onPress }: VehicleCardProps) => {
  const safetyRating = vehicle.safety_rating || 85;
  const fuelLevel = vehicle.fuel_level || 75;
  const mileage = vehicle.mileage || 0;

  return (
    <Pressable 
      style={styles.vehicleCard}
      android_ripple={{ color: 'rgba(58, 223, 250, 0.1)' }}
    >
      <View style={styles.vehicleCardContent}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleIconContainer}>
            <FontAwesome6 name="car" size={24} color="#00d9ff" />
          </View>
          <View style={styles.vehicleMainInfo}>
            <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
            <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
          </View>
          <Pressable 
            style={styles.expandButton}
            onPress={onPress}
          >
            <FontAwesome6 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#3adffa" 
            />
          </Pressable>
        </View>
        
        <View style={styles.vehicleMetrics}>
          <View style={styles.metricBadge}>
            <FontAwesome6 name="gauge" size={12} color="#3adffa" />
            <Text style={styles.metricText}>{safetyRating}%</Text>
          </View>
          <View style={styles.metricBadge}>
            <FontAwesome6 name="battery-full" size={12} color="#a3a6ff" />
            <Text style={styles.metricText}>{fuelLevel}%</Text>
          </View>
          <View style={styles.statusBadge}>
            <FontAwesome6 name="circle" size={6} color={(vehicle as any).in_transit ? '#3adffa' : '#6dfe9c'} />
            <Text style={styles.statusText}>{(vehicle as any).in_transit ? 'IN_TRANSIT' : 'IDLE'}</Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{vehicle.status || 'operational'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mileage</Text>
              <Text style={styles.detailValue}>{mileage} km</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {typeof vehicle.location === 'string' ? (vehicle.location || 'N/A') : (vehicle.location?.coordinates ? `${vehicle.location.coordinates[0]}, ${vehicle.location.coordinates[1]}` : 'N/A')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To</Text>
              <Text style={styles.detailValue}>
                {typeof vehicle.assigned_driver === 'string' ? (vehicle.assigned_driver || 'Unassigned') : 'Unassigned'}
              </Text>
            </View>
            
            {/* Simple Performance Bar Chart */}
            <View style={styles.graphContainer}>
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: `${safetyRating}%` as any }]}>
                  <Text style={styles.barLabel}>Safety</Text>
                </View>
                <View style={[styles.bar, { height: `${fuelLevel}%` as any }]}>
                  <Text style={styles.barLabel}>Fuel</Text>
                </View>
                <View style={[styles.bar, { height: `${Math.min((vehicle.recent_performance || 80), 100)}%` as any }]}>
                  <Text style={styles.barLabel}>Perf</Text>
                </View>
                <View style={[styles.bar, { height: `${Math.min(mileage / 1000, 100)}%` as any }]}>
                  <Text style={styles.barLabel}>Mile</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default function VehiclesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      vehicle_number: '',
      vehicle_name: '',
    },
  });

  // Individual Zustand selectors (CRITICAL: NO object destructuring)
  const vehicles = useVehicleStore((state) => state.vehicles);
  const isLoading = useVehicleStore((state) => state.isLoading);
  const isRefreshing = useVehicleStore((state) => state.isRefreshing);
  const error = useVehicleStore((state) => state.error);
  const fetchVehicles = useVehicleStore((state) => state.fetchVehicles);
  const refreshVehicles = useVehicleStore((state) => state.refreshVehicles);
  const clearError = useVehicleStore((state) => state.clearError);

  // Auth selectors
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const ownerId = user?.ownerId;

  // Fetch vehicles on mount (only once)
  const fetchInitiatedRef = useRef(false);
  useEffect(() => {
    console.log('🚗 Vehicles Screen Loaded');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  token:', token ? `${token.substring(0, 30)}...` : 'null');
    console.log('  user:', user);
    console.log('  ownerId:', ownerId);
    
    if (!fetchInitiatedRef.current && isAuthenticated && token && ownerId) {
      fetchInitiatedRef.current = true;
      console.log('✅ Vehicles Screen: Initiating vehicle fetch on mount...');
      fetchVehicles();
    } else if (!ownerId) {
      console.warn('⚠️ Vehicles Screen: Missing ownerId! Cannot fetch vehicles.');
    }
  }, [isAuthenticated, token, ownerId]);

  // Filter vehicles based on search text
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter((vehicle) =>
        vehicle.vehicle_number.toLowerCase().includes(searchText.toLowerCase()) ||
        vehicle.vehicle_name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [searchText, vehicles]);

  const handleRefresh = async () => {
    console.log('🔄 Vehicles Screen: Pull-to-refresh triggered');
    await refreshVehicles();
  };

  const handleExpandedPress = (vehicle: any) => {
    console.log('🎯 Vehicles Screen: Vehicle expanded/collapsed:', vehicle._id);
    setExpandedId(expandedId === vehicle._id ? null : vehicle._id);
  };

  const handleAddVehicle = () => {
    console.log('➕ Vehicles Screen: Add vehicle button pressed');
    setShowAddModal(true);
  };

  const onSubmitVehicle = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚗 VEHICLE CREATION REQUEST');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Debug authentication state
      console.log('\n🔐 Authentication Check:');
      console.log('  isAuthenticated:', isAuthenticated);
      console.log('  token exists:', !!token);
      console.log('  user:', user);
      console.log('  ownerId:', ownerId);
      
      // Debug form data
      console.log('\n📝 Form Data:');
      console.log('  vehicle_number:', data.vehicle_number);
      console.log('  vehicle_name:', data.vehicle_name);
      
      // Final payload
      const payload = {
        ownerId,
        vehicle_number: data.vehicle_number,
        vehicle_name: data.vehicle_name,
      };
      console.log('\n📤 Request Payload:');
      console.log(JSON.stringify(payload, null, 2));
      
      console.log('\n🌐 Making API call to POST /api/vehicles');
      
      const response = await apiClient.post('/api/vehicles', payload);

      console.log('\n✅ SUCCESS! Vehicle created');
      console.log('Response:', response.data);
      Alert.alert('Success', 'Vehicle added successfully');
      
      // Reset form and close modal
      reset();
      setShowAddModal(false);

      // Refresh vehicle list
      await refreshVehicles();
    } catch (error: any) {
      console.error('\n❌ FAILED TO ADD VEHICLE');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Status code:', error.response?.status);
      console.error('Response data:', error.response?.data);
      
      // Extract user-friendly error message
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to add vehicle. Please check your internet connection.';
        
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilters = () => {
    console.log('🔽 Vehicles Screen: Filters button pressed');
  };

  if (!isAuthenticated || !token) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContent}>
          <FontAwesome6 name="lock" size={48} color="#00d9ff" />
          <Text style={styles.errorText}>Authentication required</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1f" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00d9ff"
            colors={['#00d9ff', '#3adffa']}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Active Fleet Units</Text>
            <Text style={styles.statusIndicatorText}>System_Status: Operational</Text>
          </View>
          <Text style={styles.subtitle}>Real-time monitoring of fleet vehicles. Tactical data synchronized with core protocol.</Text>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total_Vehicles</Text>
            <Text style={styles.metricValue}>{vehicles.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active_Units</Text>
            <Text style={styles.metricValueCyan}>{vehicles.filter(v => (v as any).in_transit).length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg_Safety</Text>
            <Text style={styles.metricValueGreen}>
              {Math.round(vehicles.reduce((sum, v) => sum + ((v as any).safety_rating || 85), 0) / Math.max(vehicles.length, 1))}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Fuel_Low</Text>
            <Text style={styles.metricValueRed}>{vehicles.filter(v => ((v as any).fuel_level || 75) < 30).length}</Text>
          </View>
        </View>

        {/* Search & Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Identify vehicle..."
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
          <Pressable 
            style={styles.filterButton}
            onPress={handleFilters}
          >
            <FontAwesome6 name="sliders" size={12} color="#3adffa" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </Pressable>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <FontAwesome6 name="circle-exclamation" size={14} color="#ff6e84" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <Pressable onPress={clearError}>
              <FontAwesome6 name="xmark" size={12} color="#ff6e84" />
            </Pressable>
          </View>
        )}

        {/* Content */}
        {isLoading && !isRefreshing && vehicles.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#00d9ff" />
            <Text style={styles.loadingText}>Loading vehicles...</Text>
          </View>
        ) : filteredVehicles.length === 0 ? (
          <View style={styles.centerContent}>
            <FontAwesome6 name="car" size={48} color="#444" />
            <Text style={styles.emptyText}>
              {searchText ? 'No vehicles found' : 'No vehicles available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            contentContainerStyle={styles.vehiclesList}
            renderItem={({ item }) => (
              <VehicleCard 
                vehicle={item}
                isExpanded={expandedId === item._id}
                onPress={() => handleExpandedPress(item)}
              />
            )}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB Button */}
      <Pressable 
        style={styles.fab}
        onPress={handleAddVehicle}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.2)' }}
      >
        <FontAwesome6 name="plus" size={28} color="#070d1f" />
      </Pressable>

      {/* Add Vehicle Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vehicle</Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <FontAwesome6 name="xmark" size={16} color="#a3a6ff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Controller
                control={control}
                name="vehicle_number"
                rules={{ required: 'Vehicle number is required' }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Vehicle Number</Text>
                    <TextInput
                      style={[styles.formInput, errors.vehicle_number && { borderColor: '#ff6e84' }]}
                      placeholder="e.g., DG-006"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      editable={!isSubmitting}
                    />
                    {errors.vehicle_number && (
                      <Text style={{ color: '#ff6e84', fontSize: 11, marginTop: 4 }}>
                        {errors.vehicle_number.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="vehicle_name"
                rules={{ required: 'Vehicle name is required' }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Vehicle Name</Text>
                    <TextInput
                      style={[styles.formInput, errors.vehicle_name && { borderColor: '#ff6e84' }]}
                      placeholder="e.g., Tesla Model 3"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      editable={!isSubmitting}
                    />
                    {errors.vehicle_name && (
                      <Text style={{ color: '#ff6e84', fontSize: 11, marginTop: 4 }}>
                        {errors.vehicle_name.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Pressable 
                style={styles.submitButton}
                onPress={handleSubmit(onSubmitVehicle)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#070d1f" />
                ) : (
                  <>
                    <FontAwesome6 name="check" size={16} color="#070d1f" />
                    <Text style={styles.submitButtonText}>Add Vehicle</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
