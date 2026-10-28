import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency, formatDate, getCategoryDetails } from '@/utils/format';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { summary, allTransactions, isLoading, refresh } = useTransactions();

  // Get 5 latest transactions regardless of active filters on transactions tab
  const recentTransactions = allTransactions.slice(0, 5);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} colors={['#4F46E5']} />}>
        
        {/* User Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.welcomeText}>
              Hello, {user?.fullName || user?.username || 'User'} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card (Requirement 2.3) */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Live SQLite</Text>
            </View>
          </View>

          <Text style={styles.balanceAmount}>
            {formatCurrency(summary.balance)}
          </Text>

          {/* Income & Expense Breakdown */}
          <View style={styles.summaryBreakdown}>
            {/* Total Income */}
            <View style={styles.breakdownItem}>
              <View style={[styles.iconCircle, styles.incomeIconCircle]}>
                <Ionicons name="arrow-up" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.breakdownLabel}>Total Income</Text>
                <Text style={styles.incomeAmount}>
                  +{formatCurrency(summary.totalIncome)}
                </Text>
              </View>
            </View>

            <View style={styles.dividerVertical} />

            {/* Total Expenses */}
            <View style={styles.breakdownItem}>
              <View style={[styles.iconCircle, styles.expenseIconCircle]}>
                <Ionicons name="arrow-down" size={16} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.breakdownLabel}>Total Expenses</Text>
                <Text style={styles.expenseAmount}>
                  -{formatCurrency(summary.totalExpenses)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnIncome]}
            onPress={() => router.push({ pathname: '/transaction/form', params: { defaultType: 'income' } })}>
            <Ionicons name="add-circle" size={20} color="#10B981" />
            <Text style={styles.actionBtnText}>Add Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnExpense]}
            onPress={() => router.push({ pathname: '/transaction/form', params: { defaultType: 'expense' } })}>
            <Ionicons name="remove-circle" size={20} color="#EF4444" />
            <Text style={styles.actionBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.seeAllText}>See All ({allTransactions.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions List */}
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No transactions recorded</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking your income and expenses by tapping the buttons above.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => router.push('/transaction/form')}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyAddButtonText}>Add First Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {recentTransactions.map((tx) => {
              const cat = getCategoryDetails(tx.category, tx.type);
              const isIncome = tx.type === 'income';

              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.txCard}
                  onPress={() => router.push(`/transaction/${tx.id}`)}>
                  <View style={[styles.txIconBox, { backgroundColor: cat.color + '1A' }]}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory}>{tx.category}</Text>
                    <Text style={styles.txMeta} numberOfLines={1}>
                      {formatDate(tx.date)} {tx.note ? `• ${tx.note}` : ''}
                    </Text>
                  </View>

                  <View style={styles.txAmountContainer}>
                    <Text style={[styles.txAmount, isIncome ? styles.incomeText : styles.expenseText]}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 13,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  balanceCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#C7D2FE',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: '#312E81',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 12,
    letterSpacing: -0.5,
  },
  summaryBreakdown: {
    flexDirection: 'row',
    backgroundColor: '#312E81',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dividerVertical: {
    width: 1,
    height: 36,
    backgroundColor: '#4338CA',
    marginHorizontal: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeIconCircle: {
    backgroundColor: '#064E3B',
  },
  expenseIconCircle: {
    backgroundColor: '#7F1D1D',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#C7D2FE',
    fontWeight: '500',
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
    marginTop: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionBtnIncome: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  actionBtnExpense: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  transactionList: {
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
  txCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  txMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  txAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    marginBottom: 18,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  emptyAddButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
