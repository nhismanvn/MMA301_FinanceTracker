import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, getCategoryDetails } from '@/utils/format';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTransaction, removeTransaction } = useTransactions();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (id) {
        const item = await getTransaction(id);
        setTransaction(item);
      }
      setIsLoading(false);
    }
    load();
  }, [id, getTransaction]);

  const executeDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await removeTransaction(id);
      setShowDeleteModal(false);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete transaction.');
      setIsDeleting(false);
    }
  };

  const handleDeletePress = () => {
    if (Platform.OS === 'web') {
      setShowDeleteModal(true);
    } else {
      Alert.alert(
        'Delete Transaction',
        'Are you sure you want to delete this transaction? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={styles.notFoundTitle}>Transaction Not Found</Text>
        <Text style={styles.notFoundSubtitle}>
          This transaction may have been deleted or belongs to another user.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isIncome = transaction.type === 'income';
  const categoryDetails = getCategoryDetails(transaction.category, transaction.type);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header / Amount Card */}
        <View style={styles.amountCard}>
          <View
            style={[
              styles.typeBadge,
              isIncome ? styles.incomeBadge : styles.expenseBadge,
            ]}>
            <Ionicons
              name={isIncome ? 'arrow-up-circle' : 'arrow-down-circle'}
              size={16}
              color={isIncome ? '#059669' : '#DC2626'}
            />
            <Text
              style={[
                styles.typeBadgeText,
                isIncome ? styles.incomeBadgeText : styles.expenseBadgeText,
              ]}>
              {isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>

          <Text
            style={[
              styles.amountText,
              isIncome ? styles.incomeText : styles.expenseText,
            ]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>

          <Text style={styles.dateSubtext}>{formatDate(transaction.date)}</Text>
        </View>

        {/* Detailed Fields List */}
        <View style={styles.detailsCard}>
          {/* Category */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <View
                style={[
                  styles.categoryIconCircle,
                  { backgroundColor: categoryDetails.color + '1A' },
                ]}>
                <Ionicons
                  name={categoryDetails.icon as any}
                  size={18}
                  color={categoryDetails.color}
                />
              </View>
              <Text style={styles.detailLabel}>Category</Text>
            </View>
            <Text style={styles.detailValue}>{transaction.category}</Text>
          </View>

          <View style={styles.separator} />

          {/* Date */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <View style={[styles.categoryIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="calendar-outline" size={18} color="#64748B" />
              </View>
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(transaction.date)}</Text>
          </View>

          <View style={styles.separator} />

          {/* Note / Description */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <View style={[styles.categoryIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="document-text-outline" size={18} color="#64748B" />
              </View>
              <Text style={styles.detailLabel}>Note</Text>
            </View>
            <Text style={styles.detailValue}>
              {transaction.note ? transaction.note : 'No note provided'}
            </Text>
          </View>

          <View style={styles.separator} />

          {/* Transaction ID */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <View style={[styles.categoryIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="key-outline" size={18} color="#64748B" />
              </View>
              <Text style={styles.detailLabel}>Transaction ID</Text>
            </View>
            <Text style={[styles.detailValue, styles.monospaceText]}>
              {transaction.id}
            </Text>
          </View>

          <View style={styles.separator} />

          {/* Owner Account */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <View style={[styles.categoryIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
              </View>
              <Text style={styles.detailLabel}>User Account ID</Text>
            </View>
            <Text style={[styles.detailValue, styles.monospaceText]}>
              {transaction.userId}
            </Text>
          </View>
        </View>

        {/* Action Buttons: Edit & Delete */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/transaction/form', params: { id: transaction.id } })}>
            <Ionicons name="create-outline" size={18} color="#4F46E5" />
            <Text style={styles.editBtnText}>Edit Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePress}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Delete Transaction</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Delete Confirmation Modal for Web & Universal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <Ionicons name="trash" size={32} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to permanently delete this transaction? This will automatically recalculate your total balance.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={isDeleting}
                onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDestructiveBtn}
                disabled={isDeleting}
                onPress={executeDelete}>
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalDestructiveBtnText}>Delete</Text>
                )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  incomeBadge: {
    backgroundColor: '#ECFDF5',
  },
  expenseBadge: {
    backgroundColor: '#FEF2F2',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  incomeBadgeText: {
    color: '#059669',
  },
  expenseBadgeText: {
    color: '#DC2626',
  },
  amountText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  incomeText: {
    color: '#10B981',
  },
  expenseText: {
    color: '#EF4444',
  },
  dateSubtext: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '55%',
    textAlign: 'right',
  },
  monospaceText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#475569',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  actionsContainer: {
    gap: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  deleteBtn: {
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
  deleteBtnText: {
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
