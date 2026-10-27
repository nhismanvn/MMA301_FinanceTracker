import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { Ionicons } from '@expo/vector-icons';

function NavigationGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isLoginScreen = segments[0] === 'login';

    if (!user && !isLoginScreen) {
      // User is not signed in and trying to access app -> redirect to login
      router.replace('/login');
    } else if (user && isLoginScreen) {
      // User is signed in and on login screen -> redirect to tabs
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="wallet" size={48} color="#4F46E5" />
        </View>
        <Text style={styles.splashTitle}>FinanceTracker</Text>
        <Text style={styles.splashSubtitle}>Checking saved session...</Text>
        <ActivityIndicator size="large" color="#4F46E5" style={styles.spinner} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: '#4F46E5',
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0F172A',
        },
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen
        name="transaction/[id]"
        options={{
          headerShown: true,
          title: 'Transaction Details',
        }}
      />
      <Stack.Screen
        name="transaction/form"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <StatusBar style="auto" />
        <NavigationGuard />
      </TransactionProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  spinner: {
    marginTop: 32,
  },
});
