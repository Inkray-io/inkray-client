"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { AuthState, Account } from '@/types/auth';
import { usersAPI } from '@/lib/api';
import { clearUserSpecificCache } from '@/lib/cache-manager';

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
      if (process.env.NODE_ENV === 'development') {
        // Test basic cookie functionality
        const testValue = `test-${Date.now()}`;
        Cookies.set('test_cookie', testValue);
        const testRetrieve = Cookies.get('test_cookie');
        console.log('🧪 Cookie functionality test:', {
          set: testValue,
          retrieved: testRetrieve,
          working: testValue === testRetrieve
        });
        
        // Log all available cookies for debugging
        const allCookies = document.cookie;
        console.log('🍪 All browser cookies:', allCookies);
        console.log('🍪 Cookie parsing debug:');
        allCookies.split(';').forEach(cookie => {
          const [name, value] = cookie.trim().split('=');
          console.log(`  - ${name}: ${value?.substring(0, 20)}${value?.length > 20 ? '...' : ''}`);
        });
        
        // Clean up test cookie
        Cookies.remove('test_cookie');
      }
      
      const token = Cookies.get('access_token');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Auth initialization:', { 
          hasToken: !!token,
          tokenLength: token?.length,
          tokenSample: token ? token.substring(0, 20) + '...' : null,
          currentUrl: window.location.href,
          domain: window.location.hostname,
          port: window.location.port
        });
      }
      
      if (token) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Validating stored token...');
          }
          // Validate token by fetching user profile
          const response = await usersAPI.getProfile();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Token validation successful:', { userId: response.data?.id });
          }
          
          setState({
            account: response.data,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.warn('❌ Token validation failed, clearing stored token:', error);
          // Token is invalid, clear it and user-specific cache
          Cookies.remove('access_token');
          clearUserSpecificCache();
          setState({
            account: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('ℹ️ No stored token found, user needs to authenticate');
          console.log('🔍 Debug: Checking if access_token exists in document.cookie:', 
            document.cookie.includes('access_token'));
        }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Login function called with:', { 
        userId: account?.id, 
        username: account?.username,
        tokenLength: accessToken?.length,
        tokenSample: accessToken?.substring(0, 20) + '...'
      });
    }
    
    try {
      // Set cookie with explicit configuration for localhost development
      const cookieOptions = { 
        expires: 7, // 7 days
        path: '/',
        domain: undefined, // Let browser handle localhost
        sameSite: 'lax' as const,
        secure: false // Allow for localhost HTTP
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🍪 Setting cookie with options:', cookieOptions);
      }
      
      Cookies.set('access_token', accessToken, cookieOptions);
      
      // Immediately verify the cookie was set
      const verifyToken = Cookies.get('access_token');
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Cookie verification after setting:', {
          wasSet: !!verifyToken,
          matches: verifyToken === accessToken,
          tokenLength: verifyToken?.length
        });
      }
      
      if (!verifyToken) {
        console.error('❌ CRITICAL: Cookie was not set successfully!');
      }
      
    } catch (error) {
      console.error('❌ Error setting cookie:', error);
    }
    
    setState({
      account,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Auth state updated successfully');
    }
  };

  const logout = () => {
    // Clear authentication cookie
    Cookies.remove('access_token');
    
    // Clear user-specific cached data
    clearUserSpecificCache();
    
    setState({
      account: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚪 User logged out and cache cleared');
    }
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