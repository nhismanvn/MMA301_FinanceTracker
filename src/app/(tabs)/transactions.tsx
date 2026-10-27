import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTransactions } from '@/context/TransactionContext';
import { CATEGORIES } from '@/types';
import { formatCurrency, formatDate, getCategoryDetails } from '@/utils/format';

export default function TransactionsScreen() {
  const { transactions, isLoading, filters, setFilters, refresh } = useTransactions();

  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const handleCategorySelect = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? 'all' : category,
    }));
  };

  // Filter categories to display in the chips based on active type filter
  const availableCategories = CATEGORIES.filter((c) => {
    if (filters.type === 'income') return c.type === 'income';
    if (filters.type === 'expense') return c.type === 'expense';
    return true;
  });

  // Calculate filtered totals
  const filteredIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Screen Title & Add Button */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/transaction/form')}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by note or category..."
            placeholderTextColor="#94A3B8"
            value={filters.search}
            onChangeText={(text) => setFilters((prev) => ({ ...prev, search: text }))}
            clearButtonMode="while-editing"
          />
          {filters.search ? (
            <TouchableOpacity onPress={() => setFilters((prev) => ({ ...prev, search: '' }))}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Type Filter Segment: All | Income | Expense */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, filters.type === 'all' && styles.segmentBtnActive]}
          onPress={() => handleTypeChange('all')}>
          <Text style={[styles.segmentBtnText, filters.type === 'all' && styles.segmentBtnTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            filters.type === 'income' && [styles.segmentBtnActive, styles.incomeSegmentActive],
          ]}
          onPress={() => handleTypeChange('income')}>
          <Text
            style={[
              styles.segmentBtnText,
              filters.type === 'income' && styles.incomeSegmentTextActive,
            ]}>
            Income
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            filters.type === 'expense' && [styles.segmentBtnActive, styles.expenseSegmentActive],
          ]}
          onPress={() => handleTypeChange('expense')}>
          <Text
            style={[
              styles.segmentBtnText,
              filters.type === 'expense' && styles.expenseSegmentTextActive,
            ]}>
            Expense
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Horizontal Filter Chips */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}>
          <TouchableOpacity
            style={[
              styles.catChip,
              filters.category === 'all' && styles.catChipActive,
            ]}
            onPress={() => setFilters((prev) => ({ ...prev, category: 'all' }))}>
            <Text
              style={[
                styles.catChipText,
                filters.category === 'all' && styles.catChipTextActive,
              ]}>
              All Categories
            </Text>
          </TouchableOpacity>

          {availableCategories.map((c) => {
            const isSelected = filters.category?.toLowerCase() === c.name.toLowerCase();
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.catChip,
                  isSelected && { backgroundColor: c.color, borderColor: c.color },
                ]}
                onPress={() => handleCategorySelect(c.name)}>
                <Ionicons
                  name={c.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : c.color}
                />
                <Text
                  style={[
                    styles.catChipText,
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header: Count & Net Subtotal */}
      <View style={styles.resultsInfoBar}>
        <Text style={styles.resultsCountText}>
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'} found
        </Text>
        <Text style={styles.resultsSubtotalText}>
          Net: <Text style={filteredIncome - filteredExpense >= 0 ? styles.posNet : styles.negNet}>
            {formatCurrency(filteredIncome - filteredExpense)}
          </Text>
        </Text>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} colors={['#4F46E5']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No matching transactions</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query, type, or category filter.
            </Text>
            {(filters.search || filters.type !== 'all' || filters.category !== 'all') && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => setFilters({ search: '', type: 'all', category: 'all' })}>
                <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const cat = getCategoryDetails(item.category, item.type);
          const isIncome = item.type === 'income';

          return (
            <TouchableOpacity
              style={styles.txCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/transaction/${item.id}`)}>
              <View style={[styles.txIconBox, { backgroundColor: cat.color + '1A' }]}>
                <Ionicons name={cat.icon as any} size={22} color={cat.color} />
              </View>

              <View style={styles.txInfo}>
                <View style={styles.txHeaderRow}>
                  <Text style={styles.txCategory}>{item.category}</Text>
                  <Text style={[styles.txAmount, isIncome ? styles.incomeText : styles.expenseText]}>
                    {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                  </Text>
                </View>

                <View style={styles.txMetaRow}>
                  <Text style={styles.txDate}>{formatDate(item.date)}</Text>
                  {item.note ? (
                    <Text style={styles.txNote} numberOfLines={1}>
                      • {item.note}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={styles.chevron} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  incomeSegmentActive: {
    backgroundColor: '#ECFDF5',
  },
  expenseSegmentActive: {
    backgroundColor: '#FEF2F2',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#0F172A',
  },
  incomeSegmentTextActive: {
    color: '#059669',
  },
  expenseSegmentTextActive: {
    color: '#DC2626',
  },
  categoryScrollWrapper: {
    marginBottom: 12,
  },
  categoryChipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  catChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  resultsInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  resultsSubtotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  posNet: {
    color: '#10B981',
    fontWeight: '700',
  },
  negNet: {
    color: '#EF4444',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  incomeText: {
    color: '#10B981',
  },
  expenseText: {
    color: '#EF4444',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  txDate: {
    fontSize: 12,
    color: '#64748B',
  },
  txNote: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  chevron: {
    marginLeft: 6,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
});
