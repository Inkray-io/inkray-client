"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InviteCodeInput } from "@/components/invite/InviteCodeInput";
import { invitesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useToast } from "@/hooks/use-toast";
import { ConnectModal } from "@mysten/dapp-kit";
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Shield,
  Users,
  Coins,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { HiUserGroup } from "react-icons/hi2";
import { serif } from "./fonts";

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { isConnected, address } = useWalletConnection();
  const { toast } = useToast();

  const [inviteCode, setInviteCode] = useState("");
  const [codeFromLink, setCodeFromLink] = useState(false);
  const autoValidatedRef = useRef(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [inviteSystemEnabled, setInviteSystemEnabled] = useState<boolean | null>(null);

  // Check if invite system is enabled
  useEffect(() => {
    const checkInviteSystem = async () => {
      try {
        const response = await invitesAPI.getSystemStatus();
        const raw = response.data.data || response.data;
        const enabled = 'enabled' in raw ? raw.enabled : false;
        setInviteSystemEnabled(enabled);

        // If invite system is disabled, redirect to auth
        if (!enabled) {
          router.push("/auth");
        }
      } catch (error) {
        console.error("Failed to check invite system status:", error);
        // Fail open: keep the invite page visible if the status check fails so a
        // transient backend hiccup doesn't bounce visitors to /auth. Validation
        // still runs against the backend when they submit a code.
        setInviteSystemEnabled(true);
      }
    };

    checkInviteSystem();
  }, [router]);

  // Redirect if already authenticated — with context, since they likely
  // arrived via a friend's invite link and would otherwise be bounced silently.
  useEffect(() => {
    if (isAuthenticated) {
      if (searchParams.get("code")) {
        toast({
          title: "You're already a member",
          description:
            "Invite codes are for new accounts. Share your own from the Invites page!",
        });
      }
      router.push("/feed");
    }
  }, [isAuthenticated, router, searchParams, toast]);

  // Check for code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setInviteCode(codeFromUrl.toUpperCase());
      setCodeFromLink(true);
    }
  }, [searchParams]);

  // Handle invite code change from the new component
  const handleCodeChange = (value: string) => {
    setInviteCode(value);
    setValidationResult(null);
  };

  const validateCode = useCallback(async () => {
    // Manual entry uses the segmented INK-XXXXXXXX input (12 chars). Codes from
    // a share link may be custom promo codes of any length — let the backend
    // decide those.
    const incomplete = codeFromLink ? inviteCode.length < 4 : inviteCode.length !== 12;
    if (incomplete) {
      setValidationResult({ valid: false, error: "Please enter a complete invite code" });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await invitesAPI.validateCode(inviteCode);
      const raw = response.data.data || response.data;
      const data = raw as { valid: boolean; message?: string; error?: string };

      if (data.valid) {
        setValidationResult({ valid: true });
        setIsSuccess(true);
        // Persist so /auth can attach it to registration after the wallet signs.
        // No redirect — we now show the connect-wallet step inline so visitors
        // stay on the landing page and see exactly what comes next.
        sessionStorage.setItem("inkray_invite_code", inviteCode);
      } else {
        // A bad code from a share link falls back to manual entry.
        if (codeFromLink) setCodeFromLink(false);
        setValidationResult({ valid: false, error: data.error || "Invalid invite code" });
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (codeFromLink) setCodeFromLink(false);
      setValidationResult({
        valid: false,
        error: errorMessage || "Failed to validate code. Please try again."
      });
    } finally {
      setIsValidating(false);
    }
  }, [inviteCode, codeFromLink]);

  // Move on to wallet sign-in + registration (code already stored).
  const proceed = useCallback(() => {
    sessionStorage.setItem("inkray_invite_code", inviteCode);
    router.push("/auth");
  }, [inviteCode, router]);

  // Auto-validate codes that arrived via a share link — the recipient
  // shouldn't have to press Continue when the code is already filled in.
  useEffect(() => {
    if (
      codeFromLink &&
      inviteSystemEnabled &&
      inviteCode &&
      !isAuthenticated &&
      !autoValidatedRef.current
    ) {
      autoValidatedRef.current = true;
      validateCode();
    }
  }, [codeFromLink, inviteSystemEnabled, inviteCode, isAuthenticated, validateCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode();
  };

  // Loading state while checking invite system
  if (inviteSystemEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: Shield,
      title: "Permanent & unblockable",
      description:
        "Your posts live on Sui and Walrus. No one can edit, gate, or take them down.",
    },
    {
      icon: Coins,
      title: "Paid directly",
      description:
        "Subscriptions, tips, and collectible articles land in your wallet — no middleman.",
    },
    {
      icon: Users,
      title: "Your audience, not a feed",
      description:
        "Readers follow you, not an algorithm. The relationship is yours to keep.",
    },
  ];

  const getCodeMethods = [
    {
      icon: FaDiscord,
      title: "Join our Discord",
      description: "Active members receive codes",
      link: "#",
      color: "bg-[#5865F2]",
    },
    {
      icon: FaXTwitter,
      title: "Follow us on X",
      description: "We share codes with followers",
      link: "#",
      color: "bg-black",
    },
    {
      icon: HiUserGroup,
      title: "Ask your network",
      description: "Every Inkray user has invite codes",
      link: null,
      color: "bg-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950">
      <div className="relative z-10 container max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Wordmark */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/logo.svg" alt="Inkray" className="h-7" />
        </motion.div>

        {/* Editorial hero — the page's thesis */}
        <motion.div
          className="max-w-2xl mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {codeFromLink ? "You've been invited" : "Invite-only · Private beta"}
            </span>
          </div>
          <h1
            className={`${serif.className} text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] tracking-tight text-gray-900 dark:text-white`}
          >
            Own everything <span className="italic text-primary">you publish.</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-400 max-w-lg">
            A publishing home where your words are permanent, unblockable, and paid
            for directly — no platform in the middle. Claim your spot below.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 items-start">
          {/* Left Column - Invite Code Entry */}
          <motion.div
            className="order-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-5 sm:p-6 overflow-hidden">
              {/* Icon + heading — adapts to the current step */}
              <div className="text-center mb-5">
                <motion.div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  {isSuccess ? (
                    <Wallet className="w-6 h-6 text-primary" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-primary" />
                  )}
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {isSuccess
                    ? isConnected
                      ? "You're in"
                      : "One step left"
                    : "Claim your invite"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSuccess
                    ? isConnected
                      ? "Create your account to start reading and writing"
                      : "Connect your Sui wallet to claim your spot"
                    : codeFromLink
                      ? "Checking your invite…"
                      : "Enter your invite code to get started"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.div
                    key="enter"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {codeFromLink ? (
                      /* Arrived via a share link — show the code as a ticket stub */
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 py-3">
                          <span className="text-lg">🎟️</span>
                          <span className="font-mono text-lg font-semibold tracking-wider text-gray-900 dark:text-white">
                            {inviteCode}
                          </span>
                        </div>
                        {isValidating && (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking your invite…
                          </div>
                        )}
                        {validationResult?.error && (
                          <p className="text-sm text-red-500 text-center">
                            {validationResult.error}
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Manual entry */
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <InviteCodeInput
                            value={inviteCode}
                            onChange={handleCodeChange}
                            disabled={isValidating}
                            error={validationResult?.valid === false}
                          />
                          <AnimatePresence>
                            {validationResult?.error && (
                              <motion.p
                                className="text-sm text-red-500 text-center"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                {validationResult.error}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-11"
                          disabled={inviteCode.length !== 12 || isValidating}
                        >
                          {isValidating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Validating…
                            </>
                          ) : (
                            "Continue"
                          )}
                        </Button>
                      </form>
                    )}
                  </motion.div>
                ) : (
                  /* Step 2 — invite accepted, now connect the wallet */
                  <motion.div
                    key="connect"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-green-800 dark:text-green-200">
                        Invite accepted
                      </span>
                      <span className="ml-auto font-mono text-xs text-green-700 dark:text-green-300">
                        {inviteCode}
                      </span>
                    </div>

                    {isConnected ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                          <Wallet className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Wallet connected
                          </span>
                          <span className="ml-auto font-mono text-xs text-gray-500">
                            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""}
                          </span>
                        </div>
                        <Button onClick={proceed} className="w-full h-11 gap-2">
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-3.5 py-3">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-0.5">
                            Connect your wallet to continue
                          </p>
                          <p className="text-xs leading-relaxed text-blue-700/80 dark:text-blue-300/80">
                            Inkray accounts are secured by your Sui wallet — no email or password. Connect one to finish signing up.
                          </p>
                        </div>
                        <ConnectModal
                          trigger={
                            <Button className="w-full h-11 gap-2">
                              <Wallet className="w-4 h-4" />
                              Connect wallet
                            </Button>
                          }
                        />
                        <p className="text-xs text-center text-gray-400">
                          New to Sui? A wallet is free and takes about a minute to set up.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* How to Get an Invite — only while they still need a code */}
            {!isSuccess && (
            <motion.div
              className="mt-4 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-4 sm:p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Don&apos;t have an invite?
              </h3>
              <div className="space-y-2">
                {getCodeMethods.map((method, index) => (
                  <motion.div
                    key={method.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    {method.link ? (
                      <a
                        href={method.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div className={`w-9 h-9 ${method.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <method.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                            {method.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {method.description}
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl">
                        <div className={`w-9 h-9 ${method.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <method.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {method.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
            )}
          </motion.div>

          {/* Right Column — the ink pitch */}
          <motion.div
            className="order-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gray-950 p-6 sm:p-7 text-white ring-1 ring-white/10">
              {/* soft ink glow */}
              <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
              <div className="relative">
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Why writers switch
                </p>
                <div className="space-y-5">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      className="flex gap-3.5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.06 }}
                    >
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                        <feature.icon className="size-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-white/55">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/40">
                  <span>Built on Sui</span>
                  <span aria-hidden>·</span>
                  <span>Stored on Walrus</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Invite-only note — full width so the columns stay balanced */}
        <motion.p
          className="mt-4 flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="leading-none">🎟️</span>
          <span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Invite-only for now.
            </span>{" "}
            Once you&apos;re in, you&apos;ll get your own codes to invite others.
          </span>
        </motion.p>

        {/* Footer */}
        <motion.footer
          className="mt-6 text-xs text-gray-400 dark:text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <p>© 2026 Inkray · Own your words.</p>
        </motion.footer>
      </div>
    </div>
  );
}
