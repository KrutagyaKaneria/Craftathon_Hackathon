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
      console.log('🚗 Fetching vehicles for assign...');
      const response = await apiClient.get('/api/vehicles');
      if (response.data.success) {
        setVehicles(response.data.data || []);
        console.log('✅ Vehicles fetched:', response.data.data?.length);
      }
    } catch (error: any) {
      console.error('❌ Error fetching vehicles:', error.message);
      Alert.alert('Error', 'Failed to fetch vehicles');
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
                    <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
                    <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
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
