"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { AuthState, Account } from '@/types/auth';
import { usersAPI } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (accessToken: string, account: Account) => void;
  logout: () => void;
  updateAccount: (account: Account) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    account: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from cookie
  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('access_token');
      
      if (token) {
        try {
          // Validate token by fetching user profile
          const response = await usersAPI.getProfile();
          setState({
            account: response.data,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid, clear it
          Cookies.remove('access_token');
          setState({
            account: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState({
          account: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = (accessToken: string, account: Account) => {
    Cookies.set('access_token', accessToken, { expires: 7 }); // 7 days
    setState({
      account,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    Cookies.remove('access_token');
    setState({
      account: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateAccount = (account: Account) => {
    setState(prev => ({
      ...prev,
      account,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}