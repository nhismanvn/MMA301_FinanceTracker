import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useTransactions } from '@/context/TransactionContext';
import { CATEGORIES, TransactionType } from '@/types';

export default function TransactionFormScreen() {
  const params = useLocalSearchParams<{ id?: string; defaultType?: string }>();
  const isEditing = Boolean(params.id);

  const { getTransaction, addTransaction, editTransaction } = useTransactions();

  const initialType: TransactionType = params.defaultType === 'income' ? 'income' : 'expense';
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(() => {
    const defaultCat = CATEGORIES.find((c) => c.type === initialType);
    return defaultCat ? defaultCat.name : '';
  });
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [note, setNote] = useState('');

  const [isLoadingInitial, setIsLoadingInitial] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load transaction if in edit mode
  useEffect(() => {
    async function loadExisting() {
      if (params.id) {
        const existing = await getTransaction(params.id);
        if (existing) {
          setType(existing.type);
          setAmount(existing.amount.toString());
          setCategory(existing.category);
          setDate(existing.date);
          setNote(existing.note || '');
        }
      }
      setIsLoadingInitial(false);
    }

    if (isEditing) {
      loadExisting();
    }
  }, [params.id, isEditing, getTransaction]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const matchingCats = CATEGORIES.filter((c) => c.type === newType);
    if (!matchingCats.some((c) => c.name === category)) {
      if (matchingCats.length > 0) {
        setCategory(matchingCats[0].name);
      }
    }
  };

  const handleQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    setErrorMessage('');

    // Validation
    const parsedAmount = parseFloat(amount);
    if (!amount.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    if (!category.trim()) {
      setErrorMessage('Please choose a category.');
      return;
    }

    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      setErrorMessage('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && params.id) {
        await editTransaction(params.id, {
          type,
          amount: parsedAmount,
          category: category.trim(),
          date: date.trim(),
          note: note.trim(),
        });
      } else {
        await addTransaction({
          type,
          amount: parsedAmount,
          category: category.trim(),
          date: date.trim(),
          note: note.trim(),
        });
      }
      router.back();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  const filteredCategories = CATEGORIES.filter((c) => c.type === type);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          
          {/* Header Title */}
          <View style={styles.headerBar}>
            <Text style={styles.screenTitle}>
              {isEditing ? 'Edit Transaction' : 'New Transaction'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Type Segment: Expense vs Income */}
          <View style={styles.typeSegment}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'expense' && styles.typeBtnExpenseActive,
              ]}
              onPress={() => handleTypeChange('expense')}>
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={type === 'expense' ? '#DC2626' : '#64748B'}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'expense' && styles.typeBtnExpenseTextActive,
                ]}>
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                type === 'income' && styles.typeBtnIncomeActive,
              ]}
              onPress={() => handleTypeChange('income')}>
              <Ionicons
                name="arrow-up-circle"
                size={18}
                color={type === 'income' ? '#059669' : '#64748B'}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  type === 'income' && styles.typeBtnIncomeTextActive,
                ]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Amount Input Card */}
          <View style={styles.amountInputCard}>
            <Text style={styles.fieldLabel}>Amount ($)</Text>
            <View style={styles.amountRow}>
              <Text
                style={[
                  styles.currencyPrefix,
                  type === 'income' ? styles.incomeText : styles.expenseText,
                ]}>
                {type === 'income' ? '+' : '-'} $
              </Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus={!isEditing}
              />
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map((c) => {
                const isSelected = category.toLowerCase() === c.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.categoryCard,
                      isSelected && { borderColor: c.color, backgroundColor: c.color + '15' },
                    ]}
                    onPress={() => setCategory(c.name)}>
                    <View
                      style={[
                        styles.catIconCircle,
                        { backgroundColor: isSelected ? c.color : c.color + '20' },
                      ]}>
                      <Ionicons
                        name={c.icon as any}
                        size={20}
                        color={isSelected ? '#FFFFFF' : c.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && { color: '#0F172A', fontWeight: '700' },
                      ]}
                      numberOfLines={1}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Input with Quick Shortcuts */}
          <View style={styles.formGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Transaction Date</Text>
              <View style={styles.quickDateRow}>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleQuickDate(0)}>
                  <Text style={styles.quickDateBtnText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleQuickDate(1)}>
                  <Text style={styles.quickDateBtnText}>Yesterday</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Note (Optional)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#94A3B8"
                style={[styles.inputIcon, { marginTop: 4 }]}
              />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add description or memo..."
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
            disabled={isSubmitting}
            onPress={handleSave}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Update Transaction' : 'Save Transaction'}
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  typeSegment: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeBtnExpenseActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnIncomeActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeBtnExpenseTextActive: {
    color: '#DC2626',
    fontWeight: '700',
  },
  typeBtnIncomeTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  amountInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '800',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  incomeText: {
    color: '#10B981',
  },
  expenseText: {
    color: '#EF4444',
  },
  formGroup: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickDateBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  quickDateBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  textAreaWrapper: {
    height: 88,
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
