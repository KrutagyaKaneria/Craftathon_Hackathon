import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  useSafeAreaInsets,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';
import useVehicleStore from '../store/vehicleStore';
import apiClient from '../services/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1f',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 71, 91, 0.15)',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dfe4fe',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#a3a6ff',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  vehiclesList: {
    gap: 8,
    marginBottom: 24,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    gap: 12,
  },
  vehicleCardSelected: {
    borderColor: '#a3a6ff',
    backgroundColor: 'rgba(163, 166, 255, 0.1)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#a3a6ff',
    borderColor: '#a3a6ff',
  },
  vehicleInfo: {
    flex: 1,
    gap: 4,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dfe4fe',
    marginBottom: 2,
  },
  vehicleNumber: {
    fontSize: 11,
    color: '#a5aac2',
    fontWeight: '600',
  },
  vehicleModel: {
    fontSize: 10,
    color: '#7a7f9a',
    fontWeight: '500',
  },
  vehicleMetrics: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  metricBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(163, 166, 255, 0.1)',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(163, 166, 255, 0.3)',
  },
  metricBadgeText: {
    fontSize: 8,
    color: '#a3a6ff',
    fontWeight: '600',
  },
  fuelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(109, 254, 156, 0.1)',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(109, 254, 156, 0.3)',
  },
  fuelBadgeText: {
    fontSize: 8,
    color: '#6dfe9c',
    fontWeight: '600',
  },
  warningBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 138, 76, 0.1)',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 138, 76, 0.3)',
  },
  warningBadgeText: {
    fontSize: 8,
    color: '#ff8a4c',
    fontWeight: '600',
  },
  statusBadge: {
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
  },
  selectedCount: {
    fontSize: 12,
    color: '#a5aac2',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 8,
  },
  selectedCountText: {
    color: '#a3a6ff',
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
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
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(65, 71, 91, 0.15)',
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#a3a6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#070d1f',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButtonText: {
    color: '#a5aac2',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default function AssignVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const driverId = params.driverId as string;
  const driverName = params.driverName as string;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchInitiated, setFetchInitiated] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  // Fetch vehicles on mount
  useEffect(() => {
    if (!fetchInitiated && isAuthenticated && token && driverId) {
      setFetchInitiated(true);
      fetchVehicles();
    }
  }, [isAuthenticated, token, driverId, fetchInitiated]);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      console.log('🚗 FETCHING VEHICLES FOR ASSIGNMENT...');
      console.log('   Endpoint: /api/vehicles/native/available (authenticated)');
      console.log('   Driver ID:', driverId);
      
      // Use the native app endpoint that filters by authenticated owner
      const response = await apiClient.get('/api/vehicles/native/available');
      
      console.log('✅ VEHICLE FETCH RESPONSE:', response.status);
      console.log('   Total vehicles:', response.data?.data?.length || 0);
      console.log('   Success:', response.data?.success);
      
      if (response.data.success) {
        const vehicleList = response.data.data || [];
        setVehicles(vehicleList);
        
        if (vehicleList.length > 0) {
          console.log('🚌 Available Vehicles:');
          vehicleList.slice(0, 3).forEach((v, i) => {
            console.log(`  [${i+1}] ${v.vehicle_name} (${v.vehicle_number}) - Status: ${v.status}`);
          });
        } else {
          console.warn('⚠️ No vehicles found for your account');
          console.warn('   Action: Create vehicles in the web app first, or contact admin');
        }
      } else {
        console.error('❌ API returned success=false:', response.data.message);
        throw new Error(response.data.message || 'Failed to fetch vehicles');
      }
    } catch (error: any) {
      console.error('❌ ERROR FETCHING VEHICLES:', {
        url: '/api/vehicles/native/available',
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        code: error.code
      });
      Alert.alert(
        'Error',
        `Failed to fetch vehicles\n\n${error.response?.data?.message || error.message}\n\nEnsure:\n• Backend is running\n• You own at least one vehicle\n• Vehicle belongs to your account`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicles((prev) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id) => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };

  const handleAssignVehicles = async () => {
    try {
      if (selectedVehicles.length === 0) {
        Alert.alert('Error', 'Please select at least one vehicle');
        return;
      }

      setIsSubmitting(true);
      console.log('📝 Assigning vehicles to driver:', driverId, selectedVehicles);

      const response = await apiClient.put(`/api/drivers/${driverId}/assign-vehicles`, {
        vehicleIds: selectedVehicles,
      });

      if (response.data.success) {
        console.log('✅ Vehicles assigned successfully');
        Alert.alert('Success', 'Vehicles assigned successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      console.error('❌ Error assigning vehicles:', error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign vehicles');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <FontAwesome6 name="chevron-left" size={20} color="#a5aac2" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Assign Vehicles</Text>
          <Text style={{ fontSize: 11, color: '#a5aac2' }}>For: {driverName}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Available Vehicles</Text>

        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#00d9ff" />
            <Text style={styles.loadingText}>Loading vehicles...</Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View style={styles.centerContent}>
            <FontAwesome6 name="car" size={48} color="#444" />
            <Text style={styles.emptyText}>No vehicles available</Text>
          </View>
        ) : (
          <>
            <View style={styles.vehiclesList}>
              {vehicles.map((vehicle) => (
                <Pressable
                  key={vehicle._id}
                  style={[
                    styles.vehicleCard,
                    selectedVehicles.includes(vehicle._id) && styles.vehicleCardSelected,
                  ]}
                  onPress={() => toggleVehicleSelection(vehicle._id)}
                  disabled={isSubmitting}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedVehicles.includes(vehicle._id) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedVehicles.includes(vehicle._id) && (
                      <FontAwesome6 name="check" size={14} color="#070d1f" />
                    )}
                  </View>

                  <View style={styles.vehicleInfo}>
                    <View>
                      <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
                      <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
                      {vehicle.model && <Text style={styles.vehicleModel}>{vehicle.model} • {vehicle.year || 'N/A'}</Text>}
                    </View>

                    {/* Vehicle Metrics Row */}
                    <View style={styles.vehicleMetrics}>
                      {/* Fuel Level */}
                      <View style={styles.fuelBadge}>
                        <Text style={styles.fuelBadgeText}>⛽ {vehicle.fuel_level || 0}%</Text>
                      </View>

                      {/* Mileage */}
                      <View style={styles.metricBadge}>
                        <Text style={styles.metricBadgeText}>📊 {(vehicle.mileage || 0).toLocaleString()} km</Text>
                      </View>

                      {/* Protocol Status (ACTIVE/IDLE) */}
                      <View style={[
                        styles.metricBadge,
                        { backgroundColor: vehicle.protocol_status === 'ACTIVE' ? 'rgba(109, 254, 156, 0.1)' : 'rgba(255, 193, 7, 0.1)' }
                      ]}>
                        <Text style={[
                          styles.metricBadgeText,
                          { color: vehicle.protocol_status === 'ACTIVE' ? '#6dfe9c' : '#ffc107' }
                        ]}>
                          {vehicle.protocol_status === 'IDLE' ? '⏸️' : '▶️'} {vehicle.protocol_status || 'UNKNOWN'}
                        </Text>
                      </View>

                      {/* Safety Rating */}
                      {vehicle.safety_rating && (
                        <View style={[
                          styles.metricBadge,
                          { backgroundColor: vehicle.safety_rating > 85 ? 'rgba(109, 254, 156, 0.1)' : 'rgba(255, 138, 76, 0.1)' }
                        ]}>
                          <Text style={[
                            styles.metricBadgeText,
                            { color: vehicle.safety_rating > 85 ? '#6dfe9c' : '#ff8a4c' }
                          ]}>
                            ⭐ {vehicle.safety_rating}%
                          </Text>
                        </View>
                      )}

                      {/* Location */}
                      {vehicle.location?.coordinates && (
                        <View style={styles.metricBadge}>
                          <Text style={styles.metricBadgeText}>📍 {vehicle.location.coordinates[1].toFixed(2)}, {vehicle.location.coordinates[0].toFixed(2)}</Text>
                        </View>
                      )}

                      {/* Assigned Driver */}
                      {vehicle.assigned_driver?.firstName && (
                        <View style={[styles.metricBadge, { backgroundColor: 'rgba(163, 166, 255, 0.15)' }]}>
                          <Text style={[styles.metricBadgeText, { color: '#a3a6ff' }]}>👤 {vehicle.assigned_driver.firstName}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{vehicle.status || 'AVAILABLE'}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={styles.selectedCount}>
              Selected: <Text style={styles.selectedCountText}>{selectedVehicles.length}</Text> / {vehicles.length}
            </Text>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.cancelButton]}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <FontAwesome6 name="xmark" size={16} color="#a5aac2" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleAssignVehicles}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#070d1f" />
          ) : (
            <>
              <FontAwesome6 name="check" size={16} color="#070d1f" />
              <Text style={styles.submitButtonText}>Assign</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
