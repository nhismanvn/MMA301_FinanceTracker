import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { authenticateUser, registerUser, initDatabase } from '@/database/db';

const SESSION_STORAGE_KEY = '@ft_auth_session';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName: string) => Promise<void>;
  updateSession: (updatedData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB and restore persisted authentication session on app start
  useEffect(() => {
    async function restoreSession() {
      try {
        await initDatabase();
        const savedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const parsedUser: User = JSON.parse(savedSession);
          if (parsedUser && parsedUser.id && parsedUser.username) {
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    if (!username.trim() || !password) {
      throw new Error('Please enter both username and password.');
    }

    const authenticated = await authenticateUser(username, password);
    if (!authenticated) {
      throw new Error('Invalid username or password. Please try again.');
    }

    // Persist session WITHOUT plain password
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authenticated));
    setUser(authenticated);
  };

  const register = async (username: string, password: string, fullName: string) => {
    if (!username.trim() || !password) {
      throw new Error('Please enter both username and password.');
    }
    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }
    if (!fullName.trim()) {
      throw new Error('Please enter your full name.');
    }

    const newUser = await registerUser(username, password, fullName);
    // Persist session WITHOUT plain password
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const updateSession = async (updatedData: Partial<User>) => {
    if (!user) return;
    const updatedUser: User = { ...user, ...updatedData };
    // Ghi đè session mới vào AsyncStorage
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    // Cập nhật React state để toàn app nhận thông tin mới ngay lập tức
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Error removing auth session:', e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updateSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
