"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { AuthState, Account } from '@/types/auth';
import { usersAPI } from '@/lib/api';
import { clearUserSpecificCache } from '@/lib/cache-manager';
import { log } from '@/lib/utils/Logger';

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
      // Test basic cookie functionality in development
      if (process.env.NODE_ENV === 'development') {
        const testValue = `test-${Date.now()}`;
        Cookies.set('test_cookie', testValue);
        const testRetrieve = Cookies.get('test_cookie');
        log.debug('Cookie functionality test', {
          set: testValue,
          retrieved: testRetrieve,
          working: testValue === testRetrieve
        }, 'AuthContext');

        // Log all available cookies for debugging
        const allCookies = document.cookie;
        log.debug('All browser cookies', { cookies: allCookies }, 'AuthContext');
        log.debug('Cookie parsing debug', {
          parsedCookies: allCookies.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return `${name}: ${value?.substring(0, 20)}${value?.length > 20 ? '...' : ''}`;
          })
        }, 'AuthContext');

        // Clean up test cookie
        Cookies.remove('test_cookie');
      }

      const token = Cookies.get('access_token');

      log.debug('Auth initialization', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenSample: token ? token.substring(0, 20) + '...' : null,
        currentUrl: window.location.href,
        domain: window.location.hostname,
        port: window.location.port
      }, 'AuthContext');
      
      if (token) {
        try {
          log.debug('Validating stored token', {}, 'AuthContext');

          // Validate token by fetching user profile
          const response = await usersAPI.getProfile();

          log.debug('Token validation successful', { userId: response.data?.id }, 'AuthContext');

          // If profile returns null but token is valid, we still have authentication
          // This can happen if the account record doesn't exist in the database yet
          // API response is wrapped: { success: true, data: account }
          const accountData = response.data?.data || response.data;
          if (accountData) {
            setState({
              account: accountData,
              accessToken: token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is valid but no profile data - try to decode token to get basic info
            try {
              const tokenPayload = JSON.parse(atob(token.split('.')[1]));
              const basicAccount = {
                id: tokenPayload.sub || 'unknown',
                publicKey: tokenPayload.publicKey || tokenPayload.address || 'unknown',
                wallet: tokenPayload.wallet || 'unknown',
                blockchain: 'sui',
                username: tokenPayload.username,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              log.debug('Using token payload for account info', { publicKey: basicAccount.publicKey }, 'AuthContext');
              
              setState({
                account: basicAccount,
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
              });
            } catch (decodeError) {
              log.error('Failed to decode token, treating as invalid', decodeError, 'AuthContext');
              throw new Error('Invalid token format');
            }
          }
        } catch (error) {
          log.warn('Token validation failed, clearing stored token', error, 'AuthContext');

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
        log.debug('No stored token found, user needs to authenticate', {
          hasAccessTokenInCookie: document.cookie.includes('access_token')
        }, 'AuthContext');

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
    log.debug('Login function called', {
      userId: account?.id,
      username: account?.username,
      tokenLength: accessToken?.length,
      tokenSample: accessToken?.substring(0, 20) + '...'
    }, 'AuthContext');

    try {
      // Set cookie with explicit configuration for localhost development
      const cookieOptions = {
        expires: 7, // 7 days
        path: '/',
        domain: undefined, // Let browser handle localhost
        sameSite: 'lax' as const,
        secure: false // Allow for localhost HTTP
      };

      log.debug('Setting cookie with options', cookieOptions, 'AuthContext');

      Cookies.set('access_token', accessToken, cookieOptions);

      // Immediately verify the cookie was set
      const verifyToken = Cookies.get('access_token');
      log.debug('Cookie verification after setting', {
        wasSet: !!verifyToken,
        matches: verifyToken === accessToken,
        tokenLength: verifyToken?.length
      }, 'AuthContext');

      if (!verifyToken) {
        log.error('CRITICAL: Cookie was not set successfully', {}, 'AuthContext');
      }

    } catch (error) {
      log.error('Error setting cookie', error, 'AuthContext');
    }

    setState({
      account,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });

    log.debug('Auth state updated successfully', {}, 'AuthContext');
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

    log.debug('User logged out and cache cleared', {}, 'AuthContext');
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