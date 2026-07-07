"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { authAPI, feedAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { HiDocumentText, HiOutlineBanknotes } from "react-icons/hi2";
import { useToast } from "@/hooks/use-toast";
import {
  useSignPersonalMessage,
  ConnectModal,
} from "@mysten/dapp-kit";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Identicon } from "@/components/ui/Identicon";
import { Skeleton } from "@/components/ui/skeleton";
import { log } from "@/lib/utils/Logger";
import Link from "next/link";
import { serif } from "../invite/fonts";

/**
 * Minimal shape the popular-post cards need from the feed response.
 */
interface PopularPost {
  id: string;
  slug: string;
  title: string;
  publicationId: string;
  publicationName?: string | null;
  followInfo?: { publicationName?: string | null };
  totalLikes: number;
  readTimeMinutes?: number | null;
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

/**
 * A popular article as a minimal platform card: publication identicon +
 * name, title, and the muted metrics row — the FeedPost grammar, compact.
 */
function PopularPostCard({ post, rank }: { post: PopularPost; rank: number }) {
  const publicationName =
    post.publicationName || post.followInfo?.publicationName || "Publication";

  return (
    <Link
      href={`/article?id=${encodeURIComponent(post.slug)}`}
      className="group block h-28 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 hover:shadow transition-all"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="size-5 rounded-full overflow-hidden shrink-0">
          <Identicon seed={post.publicationId} />
        </span>
        <span className="text-xs text-gray-500 truncate">{publicationName}</span>
        <span className="ml-auto text-[11px] font-semibold tabular-nums text-gray-300 shrink-0">
          #{rank}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {post.title}
      </h3>
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3" />
          {post.totalLikes}
        </span>
        {post.readTimeMinutes ? <span>{post.readTimeMinutes} min read</span> : null}
        <ArrowUpRight className="ml-auto size-3.5 text-gray-300 opacity-0 -translate-x-0.5 translate-y-0.5 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
      </div>
    </Link>
  );
}

/**
 * Top-3 popular posts, one at a time with a slow crossfade. Static under
 * prefers-reduced-motion; renders nothing if the feed is empty or fails.
 */
function PopularPostsCarousel() {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const { data: posts, isLoading } = useQuery<PopularPost[]>({
    queryKey: ["auth", "popular-posts"],
    queryFn: async () => {
      const res = await feedAPI.getArticles({
        type: "popular",
        limit: 3,
        timeframe: "week",
      });
      const data = res.data.data ?? res.data;
      return (data.articles ?? []) as PopularPost[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (reducedMotion || !posts || posts.length < 2) return undefined;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % posts.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [reducedMotion, posts]);

  if (isLoading) {
    return (
      <div className="mt-8">
        <Skeleton className="h-3 w-28 mb-3" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (!posts || posts.length === 0) return null;

  const current = posts[index % posts.length];

  return (
    <div className="mt-8">
      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-2.5">
        Popular this week
      </p>
      <div className="relative">
        {/* Static deck — a quiet hint that more cards sit beneath */}
        {posts.length > 1 && (
          <>
            <div className="absolute left-4 right-4 top-3.5 h-28 rounded-xl border border-gray-200/70 bg-white shadow-sm" />
            <div className="absolute left-2 right-2 top-2 h-28 rounded-xl border border-gray-200/70 bg-white shadow-sm" />
          </>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <PopularPostCard post={current} rank={(index % posts.length) + 1} />
          </motion.div>
        </AnimatePresence>
      </div>
      {posts.length > 1 && (
        <div className="mt-6 flex items-center gap-1.5">
          {posts.map((post, i) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show post ${i + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === index % posts.length
                  ? "w-4 bg-gray-400"
                  : "w-1.5 bg-gray-200 hover:bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The left panel — a soft wash of the page's own palette, the editorial
 * statement, this week's popular posts, and the quiet value rows.
 */
function IdentityPanel() {
  return (
    <div className="relative h-full overflow-hidden border-r border-gray-100 bg-gradient-to-b from-blue-50/70 via-neutral-50 to-neutral-50">
      <div className="relative h-full flex flex-col justify-between p-10 xl:p-14">
        <Link href="/" className="inline-flex w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Inkray" className="h-7" />
        </Link>

        {/* Statement + popular posts */}
        <div className="max-w-sm w-full">
          <h1
            className={`${serif.className} text-4xl xl:text-[2.75rem] leading-[1.08] tracking-tight text-gray-900`}
          >
            Your keys are <em>your byline.</em>
          </h1>
          <p className="mt-4 text-sm xl:text-base leading-relaxed text-gray-600">
            Sign in with your Sui wallet — no email, no password. Your
            articles, your readers, and your earnings all follow your address.
          </p>

          <PopularPostsCarousel />
        </div>

        {/* Quiet value rows */}
        <div className="space-y-2.5 text-[13px] text-gray-500">
          <p className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 shrink-0 text-gray-400" />
            A free signature proves it&apos;s you — nothing is sent on-chain.
          </p>
          <p className="flex items-center gap-2.5">
            <HiDocumentText className="size-4 shrink-0 text-gray-400" />
            Articles are stored on-chain, owned by your address — not by us.
          </p>
          <p className="flex items-center gap-2.5">
            <HiOutlineBanknotes className="size-4 shrink-0 text-gray-400" />
            Tips and collects settle straight to your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Compact masthead version of the panel for small screens. */
function IdentityBand({ address }: { address: string | null | undefined }) {
  return (
    <div className="lg:hidden">
      <div className="h-20 rounded-t-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border-b border-gray-100" />
      <div className="px-8 -mt-8">
        {address ? (
          <span className="block size-16 rounded-full overflow-hidden ring-4 ring-white shadow-sm">
            <Identicon seed={address} />
          </span>
        ) : (
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-white ring-4 ring-white shadow-sm border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Inkray" className="h-6" />
          </span>
        )}
      </div>
    </div>
  );
}

/** The real two-step sequence: connect, then sign. */
function StepChips({ step }: { step: "connect" | "sign" | "authenticate" }) {
  const connectDone = step !== "connect";
  const steps = [
    { label: "Connect", active: step === "connect", done: connectDone },
    { label: "Sign", active: step !== "connect", done: false },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          {i > 0 && <div className="w-6 h-px bg-gray-200" />}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              s.done
                ? "bg-green-50 text-green-700"
                : s.active
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {s.done ? (
              <Check className="size-3" />
            ) : (
              <span className="tabular-nums">{i + 1}</span>
            )}
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const { disconnect, isConnected, address } = useWalletConnection();
  const { toast } = useToast();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  const [authData, setAuthData] = useState<{ nonce: string; message: string; timestamp: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'sign' | 'authenticate'>('connect');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteSystemChecked, setInviteSystemChecked] = useState(false);

  // Where to land after sign-in (set by RequireAuth); internal paths only
  const rawNext = searchParams.get('next');
  const nextPath =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : '/feed';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(nextPath);
    }
  }, [isAuthenticated, router, nextPath]);

  // Check for invite code in URL or sessionStorage (don't redirect - let backend handle validation)
  useEffect(() => {
    // Get invite code from URL or sessionStorage
    const codeFromUrl = searchParams.get('code');
    const codeFromStorage = sessionStorage.getItem('inkray_invite_code');
    const code = codeFromUrl || codeFromStorage;

    if (code) {
      setInviteCode(code);
      // Store in sessionStorage for later use
      sessionStorage.setItem('inkray_invite_code', code);
    }

    // Always mark as checked - we'll let the backend validate if invite is required
    // The backend will return INVITE_REQUIRED error if user needs an invite code
    setInviteSystemChecked(true);
  }, [searchParams]);

  const initializeNonce = useCallback(async () => {
    try {
      log.debug('Initializing authentication', {}, 'AuthPage');
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

      log.debug('Auth data initialized successfully', {}, 'AuthPage');

      setAuthData(authDataObj);
    } catch (error) {
      log.error('Failed to initialize auth', { error }, 'AuthPage');
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

  // Handle wallet connection state and smart re-authentication
  useEffect(() => {
    if (isConnected && address && authData) {
      setStep('sign');
      setIsLoading(false); // Clear loading state once connected
    } else if (!isConnected) {
      setStep('connect');
    }
  }, [isConnected, address, authData]);

  const handleSign = useCallback(() => {
    if (!authData || !address) return;

    setIsLoading(true);
    setStep('authenticate');

    signPersonalMessage(
      {
        message: new TextEncoder().encode(authData.message),
      },
      {
        onSuccess: async (result) => {
          await authenticateWithSignature(result.signature);
        },
        onError: (error) => {
          log.error('Signing failed', { error }, 'AuthPage');

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
      const authPayload: {
        nonce: string;
        timestamp: string;
        signature: string;
        publicKey: string;
        wallet: string;
        blockchain: string;
        inviteCode?: string;
      } = {
        nonce: authData.nonce,
        timestamp: authData.timestamp,
        signature,
        publicKey: address,
        wallet: "Sui Wallet", // TODO: Get actual wallet name
        blockchain: "SUI",
      };

      // Include invite code if available
      if (inviteCode) {
        authPayload.inviteCode = inviteCode;
      }

      const response = await authAPI.authenticate(authPayload);

      // Access the nested data structure correctly (same as we did for auth/init)
      const responseData = response.data.data || response.data;

      // Verify we have the required data
      if (!responseData?.accessToken) {
        throw new Error('No access token received from authentication API');
      }

      if (!responseData?.account) {
        throw new Error('No account data received from authentication API');
      }

      // Clear invite code after successful registration
      sessionStorage.removeItem('inkray_invite_code');

      login(responseData.accessToken, responseData.account);
      toast({
        title: "Signed in",
        description: "Welcome back to Inkray.",
      });
      router.push(nextPath);
    } catch (error: unknown) {
      log.error('Authentication failed', { error }, 'AuthPage');

      const errorResponse = (error as { response?: { data?: { error?: { code?: string; message?: string }; message?: string } } })?.response?.data;
      const errorCode = errorResponse?.error?.code;
      const errorMessage = errorResponse?.error?.message || errorResponse?.message;

      // Handle invite-related errors - redirect without toast, the invite page handles messaging
      if (errorCode === 'INVITE_REQUIRED' || errorCode === 'INVALID_INVITE_CODE') {
        sessionStorage.removeItem('inkray_invite_code');
        router.push('/invite');
        return;
      }

      setIsLoading(false);
      setStep('sign');

      toast({
        title: "Authentication Failed",
        description: errorMessage || "Please try signing the message again.",
        variant: "destructive",
      });
    }
  }, [authData, address, login, toast, router, inviteCode, nextPath]);

  const handleDisconnect = () => {
    disconnect();
    setStep('connect');
  };

  if ((isLoading && step === 'connect') || !inviteSystemChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            {!inviteSystemChecked ? "Checking access..." : "Preparing sign-in..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 lg:grid lg:grid-cols-2">
      {/* Left — the living identity panel (desktop) */}
      <div className="hidden lg:block">
        <IdentityPanel />
      </div>

      {/* Right — the auth card */}
      <div className="min-h-screen lg:min-h-0 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Mobile masthead — the identity system, compact */}
            <IdentityBand address={isConnected ? address : null} />

            <div className="p-8 pt-6 lg:pt-8">
              {/* Header */}
              <div className="mb-6">
                <div className="hidden lg:flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    Sign in to Inkray
                  </h2>
                  <StepChips step={step} />
                </div>
                <div className="lg:hidden mb-5 space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    Sign in to Inkray
                  </h2>
                  <StepChips step={step} />
                </div>
                <p className="text-sm text-gray-500">
                  {step === 'connect' &&
                    'Connect your Sui wallet — your address is your account.'}
                  {step === 'sign' &&
                    'One free signature proves you own this wallet.'}
                  {step === 'authenticate' && 'Verifying your signature…'}
                </p>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {step === 'connect' && (
                  <motion.div
                    key="connect"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <ConnectModal
                      trigger={
                        <Button className="w-full h-11 gap-2 text-sm font-semibold">
                          <Wallet className="size-4" />
                          Connect wallet
                        </Button>
                      }
                    />

                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-100" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-gray-400">or</span>
                      </div>
                    </div>

                    {/* Google / zkLogin sign-in — not yet enabled on mainnet */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 justify-center gap-2 text-sm"
                      disabled
                      aria-disabled="true"
                      title="Google sign-in is coming soon"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                      </svg>
                      Continue with Google
                      <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                        Coming soon
                      </span>
                    </Button>

                    <p className="text-xs text-center text-gray-400">
                      New to Sui? A wallet is free and takes about a minute to
                      set up.
                    </p>
                  </motion.div>
                )}

                {step === 'sign' && (
                  <motion.div
                    key="sign"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {/* Connected wallet chip */}
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-neutral-50 px-3.5 py-3">
                      {address && (
                        <span className="size-9 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                          <Identicon seed={address} />
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-green-500" />
                          Wallet connected
                        </p>
                        <p className="text-xs font-mono text-gray-500 truncate">
                          {address && shortAddress(address)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={isLoading}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer"
                      >
                        Switch
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Signing is free and doesn&apos;t send a transaction — it
                      only proves the wallet is yours.
                    </p>

                    <Button
                      onClick={handleSign}
                      disabled={isLoading}
                      className="w-full h-11 gap-2 text-sm font-semibold"
                    >
                      {isLoading && <Loader2 className="size-4 animate-spin" />}
                      Sign message
                    </Button>

                    {/* The raw message, tucked away for the curious */}
                    {authData?.message && (
                      <details className="group">
                        <summary className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer list-none w-fit transition-colors">
                          <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                          View the message you&apos;re signing
                        </summary>
                        <pre className="mt-2 p-3 rounded-lg bg-neutral-50 border border-gray-100 text-[11px] leading-relaxed text-gray-500 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                          {authData.message}
                        </pre>
                      </details>
                    )}
                  </motion.div>
                )}

                {step === 'authenticate' && (
                  <motion.div
                    key="authenticate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="py-6 text-center space-y-3"
                  >
                    <Loader2 className="size-7 animate-spin mx-auto text-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Verifying your signature
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        This usually takes a second or two.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-7 pt-5 border-t border-gray-100">
                <p className="text-[11px] text-center text-gray-400 leading-relaxed">
                  By signing in you agree to our{" "}
                  <Link
                    href="/rules"
                    className="underline underline-offset-2 hover:text-gray-600 transition-colors"
                  >
                    platform rules
                  </Link>
                  . We never see your keys — signatures are created in your
                  wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Below-card escape hatch */}
          <p className="mt-4 text-xs text-center text-gray-400">
            Just browsing?{" "}
            <Link
              href="/feed"
              className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors"
            >
              Read without signing in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
