"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSignPersonalMessage } from "@mysten/dapp-kit";

export default function AuthPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { connect, disconnect, isConnected, address } = useWalletConnection();
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

  // Initialize nonce when component mounts
  useEffect(() => {
    initializeNonce();
  }, []);

  // Handle wallet connection state
  useEffect(() => {
    if (isConnected && address && authData) {
      setStep('sign');
    } else if (!isConnected) {
      setStep('connect');
    }
  }, [isConnected, address, authData]);

  const initializeNonce = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.initAuth();
      // Extract timestamp from the message (it's embedded in the message)
      const timestampMatch = response.data.message.match(/Timestamp: (.+)\n/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      
      setAuthData({
        nonce: response.data.nonce,
        message: response.data.message,
        timestamp,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    if (!authData) return;
    setIsLoading(true);
    connect();
  };

  const handleSign = () => {
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
        onSuccess: (result) => {
          authenticateWithSignature(result.signature);
        },
        onError: (error) => {
          console.error('Signing failed:', error);
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
  };

  const authenticateWithSignature = async (signature: string) => {
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

      login(response.data.accessToken, response.data.account);
      toast({
        title: "Success",
        description: "Successfully authenticated!",
      });
      router.push('/feed');
    } catch (error: any) {
      console.error('Authentication failed:', error);
      setIsLoading(false);
      setStep('sign');
      toast({
        title: "Authentication Failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

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
              <Button
                onClick={handleConnect}
                disabled={isLoading || !authData}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Connect Wallet
              </Button>
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
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign the message to prove wallet ownership
              </p>

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