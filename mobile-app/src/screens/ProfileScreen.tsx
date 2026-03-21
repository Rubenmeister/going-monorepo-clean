/**
 * Profile Screen
 * User profile management, verification, and personal information
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import {
  Edit2,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  LogOut,
  ChevronRight,
} from 'react-native-feather';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  verificationStatus: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };
  preferences: {
    notificationsEnabled: boolean;
    sharingLocation: boolean;
    shareProfile: boolean;
  };
}

export const ProfileScreen: React.FC<{ onLogout?: () => void }> = ({
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.get<UserProfile>('/api/user/profile'),
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      api.put('/api/user/profile', data),
    onSuccess: () => {
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    },
  });

  const handleSaveProfile = () => {
    updateProfile(editData);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: onLogout,
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  const userData = editData.name ? editData : profile?.data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={() => {
              setIsEditing(!isEditing);
              setEditData(profile?.data || {});
            }}
          >
            {isEditing ? (
              <Save width={24} height={24} color="#007AFF" />
            ) : (
              <Edit2 width={24} height={24} color="#333" />
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Text style={styles.editAvatarText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User width={18} height={18} color="#666" />
              <Text style={styles.label}>Full Name</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={userData?.name || ''}
              onChangeText={(text) => setEditData({ ...editData, name: text })}
              editable={isEditing}
              placeholder="Full Name"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Mail width={18} height={18} color="#666" />
              <Text style={styles.label}>Email Address</Text>
            </View>
            <View style={styles.inputWithBadge}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputFlex,
                  !isEditing && styles.inputDisabled,
                ]}
                value={userData?.email || ''}
                onChangeText={(text) =>
                  setEditData({ ...editData, email: text })
                }
                editable={isEditing}
              />
              {userData?.verificationStatus?.email && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Phone width={18} height={18} color="#666" />
              <Text style={styles.label}>Phone Number</Text>
            </View>
            <View style={styles.inputWithBadge}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputFlex,
                  !isEditing && styles.inputDisabled,
                ]}
                value={userData?.phone || ''}
                onChangeText={(text) =>
                  setEditData({ ...editData, phone: text })
                }
                editable={isEditing}
              />
              {userData?.verificationStatus?.phone && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MapPin width={18} height={18} color="#666" />
              <Text style={styles.label}>Address</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={userData?.address || ''}
              onChangeText={(text) =>
                setEditData({ ...editData, address: text })
              }
              editable={isEditing}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <VerificationItem
            icon={<Shield width={18} height={18} color="#666" />}
            label="Identity Verification"
            verified={userData?.verificationStatus?.identity || false}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <PreferenceItem
            label="Push Notifications"
            value={userData?.preferences?.notificationsEnabled || false}
          />
          <PreferenceItem
            label="Location Sharing"
            value={userData?.preferences?.sharingLocation || false}
          />
          <PreferenceItem
            label="Share Profile"
            value={userData?.preferences?.shareProfile || false}
          />
        </View>

        {/* Save Button (if editing) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut width={20} height={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const VerificationItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  verified: boolean;
}> = ({ icon, label, verified }) => (
  <View style={styles.menuItem}>
    <View style={styles.menuLeft}>
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <View
      style={[
        styles.statusBadge,
        verified ? styles.statusVerified : styles.statusPending,
      ]}
    >
      <Text style={styles.statusText}>{verified ? 'Verified' : 'Pending'}</Text>
    </View>
  </View>
);

const PreferenceItem: React.FC<{ label: string; value: boolean }> = ({
  label,
  value,
}) => (
  <View style={styles.preferenceItem}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Switch value={value} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editAvatarText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
  },
  inputFlex: {
    flex: 1,
  },
  inputWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusVerified: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
