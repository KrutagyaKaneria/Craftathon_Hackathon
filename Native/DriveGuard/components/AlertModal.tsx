import React from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AlertData } from '@/hooks/useAlerts';

interface AlertModalProps {
  isVisible: boolean;
  alert: AlertData | null;
  onClose: () => void;
  onAcknowledge?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isVisible, alert, onClose, onAcknowledge }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  if (!alert) return null;

  const isHighSeverity = alert.severity === 'high';
  const accentColor = isHighSeverity ? '#FF3B30' : '#FF9500';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={StyleSheet.absoluteFill} />
        
        <ThemedView style={[styles.centeredView, { borderColor: accentColor }]}>
          <View style={[styles.header, { backgroundColor: accentColor }]}>
            <Ionicons name={isHighSeverity ? "alert-circle" : "warning"} size={32} color="#fff" />
            <ThemedText style={styles.headerText} type="subtitle">
              {alert.type.toUpperCase()} ALERT
            </ThemedText>
          </View>

          <View style={styles.content}>
            <View style={styles.infoRow}>
              <ThemedText type="defaultSemiBold">Driver:</ThemedText>
              <ThemedText>{alert.driverName}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="defaultSemiBold">Vehicle:</ThemedText>
              <ThemedText>{alert.vehicleNumber}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="defaultSemiBold">Status:</ThemedText>
              <ThemedText style={{ color: accentColor, fontWeight: 'bold' }}>{alert.subtype}</ThemedText>
            </View>
            
            <ThemedText style={styles.timeText}>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </ThemedText>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.closeButton]} 
                onPress={onClose}
              >
                <ThemedText style={styles.closeButtonText}>Ignore</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: accentColor }]} 
                onPress={() => {
                  onAcknowledge?.();
                  onClose();
                }}
              >
                <ThemedText style={styles.acknowledgeButtonText}>Acknowledge</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centeredView: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  timeText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  closeButtonText: {
    fontWeight: '600',
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
