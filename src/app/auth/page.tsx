"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSignPersonalMessage, ConnectButton } from "@mysten/dapp-kit";

export default function AuthPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { disconnect, isConnected, address } = useWalletConnection();
  const { toast } = useToast();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  
  const [authData, setAuthData] = useState<{ nonce: string; message: string; timestamp: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'sign' | 'authenticate'>('connect');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/feed');
    }
  }, [isAuthenticated, router]);

  const initializeNonce = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Initializing authentication...');
      }
      setIsLoading(true);
      const response = await authAPI.initAuth();
      
      // Access the nested data structure correctly
      const responseData = response.data.data || response.data;
      
      if (!responseData) {
        throw new Error('No data received from auth initialization');
      }
      
      if (!responseData.nonce) {
        throw new Error('No nonce received from auth initialization');
      }
      
      if (!responseData.message) {
        throw new Error('No message received from auth initialization');
      }
      
      // Extract timestamp from the message (it's embedded in the message)
      const timestampMatch = responseData.message.match(/Timestamp: (.+)\n/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      
      const authDataObj = {
        nonce: responseData.nonce,
        message: responseData.message,
        timestamp,
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Auth data initialized successfully');
      }
      
      setAuthData(authDataObj);
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      toast({
        title: "Error",
        description: "Failed to initialize authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initialize nonce when component mounts
  useEffect(() => {
    initializeNonce();
  }, [initializeNonce]);

  // Debug logging for authentication state (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Auth Debug State:', {
        isConnected,
        address,
        authData: !!authData,
        authDataDetails: authData ? { nonce: authData.nonce, hasMessage: !!authData.message } : null,
        currentStep: step,
        isLoading
      });
    }
  }, [isConnected, address, authData, step, isLoading]);

  // Handle wallet connection state and smart re-authentication
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Checking transition conditions:', { isConnected, address: !!address, authData: !!authData });
    }
    
    if (isConnected && address && authData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ All conditions met, transitioning to sign step');
      }
      setStep('sign');
      setIsLoading(false); // Clear loading state once connected
    } else if (!isConnected) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Wallet not connected, staying on connect step');
      }
      setStep('connect');
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Partial conditions met:', {
          isConnected,
          hasAddress: !!address,
          hasAuthData: !!authData
        });
      }
    }
  }, [isConnected, address, authData]);

  // Smart re-authentication: If wallet is connected and we have auth data,
  // but user ended up on auth page (likely due to expired token), auto-sign
  useEffect(() => {
    const shouldAutoSign = isConnected && address && authData && step === 'sign' && !isLoading;
    
    if (shouldAutoSign) {
      const hasRecentlyFailed = sessionStorage.getItem('auth_retry_failed');
      
      if (!hasRecentlyFailed) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auto-attempting re-authentication for connected wallet');
        }
        
        // Add a small delay to prevent immediate re-signing
        const timer = setTimeout(() => {
          handleSign();
        }, 1500);
        
        return () => clearTimeout(timer);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Skipping auto-sign due to recent failure');
        }
      }
    }
    return undefined;
  }, [isConnected, address, authData, step, isLoading]);


  const handleSign = useCallback(() => {
    if (!authData || !address) return;
    
    setIsLoading(true);
    setStep('authenticate');

    console.log('Frontend message being signed:');
    console.log(JSON.stringify(authData.message));
    console.log('Message length:', authData.message.length);

    signPersonalMessage(
      {
        message: new TextEncoder().encode(authData.message),
      },
      {
        onSuccess: async (result) => {
          await authenticateWithSignature(result.signature);
        },
        onError: (error) => {
          console.error('Signing failed:', error);
          
          // Mark that auto-retry failed to prevent infinite loops
          sessionStorage.setItem('auth_retry_failed', 'true');
          // Clear the flag after 30 seconds
          setTimeout(() => {
            sessionStorage.removeItem('auth_retry_failed');
          }, 30000);
          
          setIsLoading(false);
          setStep('sign');
          toast({
            title: "Signing Failed",
            description: "Please try signing the message again.",
            variant: "destructive",
          });
        },
      }
    );
  }, [authData, address, signPersonalMessage, toast]);

  const authenticateWithSignature = useCallback(async (signature: string) => {
    if (!authData || !address) return;

    try {
      const authPayload = {
        nonce: authData.nonce,
        timestamp: authData.timestamp,
        signature,
        publicKey: address,
        wallet: "Sui Wallet", // TODO: Get actual wallet name
        blockchain: "SUI",
      };
      
      console.log('Frontend sending auth payload:');
      console.log('Nonce:', authPayload.nonce);
      console.log('Timestamp:', authPayload.timestamp);
      console.log('PublicKey:', authPayload.publicKey);
      
      const response = await authAPI.authenticate(authPayload);

      // Access the nested data structure correctly (same as we did for auth/init)
      const responseData = response.data.data || response.data;

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Authentication API response:', {
          success: !!response.data,
          hasAccessToken: !!responseData?.accessToken,
          hasAccount: !!responseData?.account,
          accountId: responseData?.account?.id,
          tokenLength: responseData?.accessToken?.length,
          fullResponse: response.data,
          extractedData: responseData
        });
      }

      // Verify we have the required data
      if (!responseData?.accessToken) {
        throw new Error('No access token received from authentication API');
      }
      
      if (!responseData?.account) {
        throw new Error('No account data received from authentication API');
      }

      // Clear any retry failure flags on successful auth
      sessionStorage.removeItem('auth_retry_failed');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Calling login function with verified data...');
      }
      
      login(responseData.accessToken, responseData.account);
      toast({
        title: "Success",
        description: "Successfully authenticated!",
      });
      router.push('/feed');
    } catch (error: unknown) {
      console.error('Authentication failed:', error);
      
      // Mark that auth failed to prevent auto-retry loops
      sessionStorage.setItem('auth_retry_failed', 'true');
      setTimeout(() => {
        sessionStorage.removeItem('auth_retry_failed');
      }, 30000);
      
      setIsLoading(false);
      setStep('sign');
      
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      
      toast({
        title: "Authentication Failed",
        description: errorMessage || "Please try signing the message again.",
        variant: "destructive",
      });
    }
  }, [authData, address, login, toast, router]);

  const handleDisconnect = () => {
    disconnect();
    setStep('connect');
  };

  if (isLoading && step === 'connect') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-slate-900 rounded-lg shadow-lg border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Inkray
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'connect' ? 'Connect your wallet to get started' : 
             step === 'sign' ? 'Sign the message to complete authentication' :
             'Verifying your signature...'}
          </p>
        </div>

        <div className="space-y-6">
          {step === 'connect' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your Sui wallet to continue
              </p>
              <ConnectButton
                connectText="Connect Wallet"
                className="w-full"
              />
            </div>
          )}

          {step === 'sign' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  ✅ Wallet Connected
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-mono break-all">
                  {address}
                </p>
              </div>
              
              {(() => {
                const shouldAutoSign = isConnected && address && authData && !isLoading && !sessionStorage.getItem('auth_retry_failed');
                return shouldAutoSign ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      🔄 Attempting automatic re-authentication...
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      You can also sign manually if needed
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign the message to prove wallet ownership
                  </p>
                );
              })()}

              {/* Show the message being signed */}
              {authData?.message && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border text-left">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                    Message to sign:
                  </p>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                    {authData.message}
                  </pre>
                </div>
              )}
              
              <div className="space-y-3">
                <Button
                  onClick={handleSign}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Sign Message
                </Button>
                
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Disconnect Wallet
                </Button>
              </div>
            </div>
          )}

          {step === 'authenticate' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Authenticating...
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Please wait while we verify your signature
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By connecting your wallet, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}