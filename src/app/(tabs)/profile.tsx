import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency } from '@/utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { summary } = useTransactions();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmSignOut = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: confirmSignOut,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Account Profile</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </Text>
          </View>

          <Text style={styles.userName}>{user?.fullName || 'Finance User'}</Text>
          <Text style={styles.userHandle}>@{user?.username || 'user'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.userIdPill}>
              <Ionicons name="finger-print-outline" size={12} color="#4F46E5" />
              <Text style={styles.userIdText}>ID: {user?.id}</Text>
            </View>
            <View style={[styles.userIdPill, styles.activeSessionPill]}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" />
              <Text style={styles.activeSessionText}>Session Persisted</Text>
            </View>
          </View>
        </View>

        {/* Financial Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account Financial Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Total Records</Text>
              <Text style={styles.statBoxValue}>{summary.transactionCount}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Net Balance</Text>
              <Text style={[styles.statBoxValue, summary.balance >= 0 ? styles.posText : styles.negText]}>
                {formatCurrency(summary.balance)}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Lifetime Income</Text>
              <Text style={[styles.statBoxValue, styles.posText]}>
                +{formatCurrency(summary.totalIncome)}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Lifetime Expenses</Text>
              <Text style={[styles.statBoxValue, styles.negText]}>
                -{formatCurrency(summary.totalExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Data Isolation & Lab Info Box */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={20} color="#4F46E5" />
            <Text style={styles.infoCardTitle}>Data Isolation Note</Text>
          </View>
          <Text style={styles.infoCardBody}>
            This application uses local SQLite database storage. Transactions are strictly isolated by account ID (<Text style={styles.boldText}>{user?.id}</Text>). Signing in with a different account will switch to that account&apos;s private dataset.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Web Modal Confirmation */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <Ionicons name="log-out" size={32} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Confirm Sign Out</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to sign out? Your session will be cleared from this device.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDestructiveBtn}
                onPress={confirmSignOut}>
                <Text style={styles.modalDestructiveBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerBar: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    borderWidth: 3,
    borderColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4F46E5',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  userHandle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  userIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 5,
  },
  userIdText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  activeSessionPill: {
    backgroundColor: '#ECFDF5',
  },
  activeSessionText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  posText: {
    color: '#10B981',
  },
  negText: {
    color: '#EF4444',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 24,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  infoCardBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E1B4B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalDestructiveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalDestructiveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
