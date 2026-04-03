import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

interface UserHeaderProps {
  showLogout?: boolean;
  onLogout?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ showLogout = true, onLogout }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <FontAwesome6 name="user-circle" size={32} color="#00D9FF" />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{user.name || 'Commander'}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      {showLogout && onLogout && (
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <FontAwesome6 name="sign-out-alt" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.2)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 11,
    color: '#00D9FF',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    marginLeft: 12,
  },
});
