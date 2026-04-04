import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
  Text,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || 'Valid email format required';
  };

  const onSubmit = async (data: FormData) => {
    // Additional form validation
    if (!data.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    if (!data.password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }

    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const result = await signup(data.email, data.password);

    if (result.success) {
      // Navigate to Dashboard/Home
      router.replace('/(tabs)');
    } else {
      Alert.alert('Signup Failed', result.error || 'An error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollInner}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.shieldIcon}>
            <FontAwesome6 name="shield" size={40} color="#A8B4FF" solid />
          </View>
          <Text style={styles.protocolText}>THE SENTINEL PROTOCOL</Text>
          <Text style={styles.welcomeText}>Create Account</Text>
        </View>

        {/* Signup Form */}
        <View style={styles.formSection}>
          {/* Email Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>DEPLOYMENT EMAIL</Text>
            <View style={styles.inputContainer}>
              <FontAwesome6 name="at" size={20} color="#6B7280" />
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  validate: validateEmail,
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.textInput}
                    placeholder="commander@guardian.ai"
                    placeholderTextColor="#4B5563"
                    value={value}
                    onChangeText={onChange}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>ACCESS KEY</Text>
            <View style={styles.inputContainer}>
              <FontAwesome6 name="key" size={20} color="#6B7280" />
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="#4B5563"
                    value={value}
                    onChangeText={onChange}
                    editable={!isLoading}
                    secureTextEntry={!showPassword}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <FontAwesome6
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* Confirm Password Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>CONFIRM ACCESS KEY</Text>
            <View style={styles.inputContainer}>
              <FontAwesome6 name="key" size={20} color="#6B7280" />
              <Controller
                control={control}
                name="confirmPassword"
                rules={{
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="#4B5563"
                    value={value}
                    onChangeText={onChange}
                    editable={!isLoading}
                    secureTextEntry={!showConfirmPassword}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <FontAwesome6
                  name={showConfirmPassword ? 'eye' : 'eye-slash'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}
          </View>

          {/* API Error Message */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.authorizeButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#1A1F2E" />
            ) : (
              <>
                <Text style={styles.authorizeButtonText}>CREATE ACCOUNT</Text>
                <FontAwesome6 name="arrow-right" size={18} color="#1A1F2E" />
              </>
            )}
          </TouchableOpacity>

          {/* Secondary Options */}
          <View style={styles.secondarySection}>
            <TouchableOpacity style={styles.secondaryButton}>
              <FontAwesome6 name="snowflake" size={20} color="#A8B4FF" />
              <Text style={styles.secondaryButtonText}>SSO SIGNUP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <FontAwesome6 name="circle-question" size={20} color="#A8B4FF" />
              <Text style={styles.secondaryButtonText}>REQUEST</Text>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have access? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SYSTEM ONLINE</Text>
          </View>
          <Text style={styles.versionText}>V4.2.0-SENTINEL</Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shieldIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168, 180, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#1A1F2E',
  },
  protocolText: {
    fontSize: 12,
    color: '#6DA8D8',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formSection: {
    marginBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    color: '#677E8C',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3142',
    paddingHorizontal: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 14,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBoxText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  authorizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#A8B4FF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  authorizeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1F2E',
    letterSpacing: 1,
  },
  secondarySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A3142',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8B4FF',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 12,
    color: '#677E8C',
  },
  loginLink: {
    fontSize: 12,
    color: '#6DA8D8',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2A3142',
    marginTop: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    color: '#677E8C',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 10,
    color: '#677E8C',
    letterSpacing: 0.5,
  },
});
