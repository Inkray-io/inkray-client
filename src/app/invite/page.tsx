"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invitesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { HiUserGroup } from "react-icons/hi2";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [inviteCode, setInviteCode] = useState("");
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
        const data = response.data.data || response.data;
        setInviteSystemEnabled(data.enabled);

        // If invite system is disabled, redirect to auth
        if (!data.enabled) {
          router.push("/auth");
        }
      } catch (error) {
        console.error("Failed to check invite system status:", error);
        // On error, allow access (fail open for better UX)
        setInviteSystemEnabled(false);
        router.push("/auth");
      }
    };

    checkInviteSystem();
  }, [router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/feed");
    }
  }, [isAuthenticated, router]);

  // Check for code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setInviteCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Format invite code as user types (INK-XXXXXXXX)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");

    // Auto-add INK- prefix if not present
    if (value.length > 0 && !value.startsWith("INK-")) {
      if (value.startsWith("INK")) {
        value = "INK-" + value.slice(3);
      } else {
        value = "INK-" + value;
      }
    }

    // Limit to 12 characters (INK-XXXXXXXX)
    if (value.length > 12) {
      value = value.slice(0, 12);
    }

    setInviteCode(value);
    setValidationResult(null);
  };

  const validateCode = useCallback(async () => {
    if (inviteCode.length !== 12) {
      setValidationResult({ valid: false, error: "Please enter a complete invite code" });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await invitesAPI.validateCode(inviteCode);
      const data = response.data.data || response.data;

      if (data.valid) {
        setValidationResult({ valid: true });
        setIsSuccess(true);

        // Store code in sessionStorage and redirect to auth
        sessionStorage.setItem("inkray_invite_code", inviteCode);

        setTimeout(() => {
          router.push("/auth");
        }, 1500);
      } else {
        setValidationResult({ valid: false, error: data.error || "Invalid invite code" });
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setValidationResult({
        valid: false,
        error: errorMessage || "Failed to validate code. Please try again."
      });
    } finally {
      setIsValidating(false);
    }
  }, [inviteCode, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode();
  };

  // Loading state while checking invite system
  if (inviteSystemEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: Shield,
      title: "True Ownership",
      description: "Your content lives on-chain in your vault. You hold the keys, not the platform.",
    },
    {
      icon: Sparkles,
      title: "Earn From Content",
      description: "Monetize through subscriptions, tips, and NFT collectibles.",
    },
    {
      icon: Users,
      title: "Own Your Audience",
      description: "Direct relationship with readers. No algorithms deciding your reach.",
    },
    {
      icon: Zap,
      title: "AI-Powered Discovery",
      description: "Smart recommendations help readers find your best work.",
    },
  ];

  const getCodeMethods = [
    {
      icon: FaDiscord,
      title: "Join our Discord",
      description: "Active community members receive invite codes",
      link: "#", // Placeholder
      color: "bg-[#5865F2]",
    },
    {
      icon: FaXTwitter,
      title: "Follow us on X",
      description: "We share codes with our followers",
      link: "#", // Placeholder
      color: "bg-black",
    },
    {
      icon: HiUserGroup,
      title: "Ask your network",
      description: "Every Inkray user has invite codes to share",
      link: null,
      color: "bg-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src="/logo.svg" alt="Inkray" className="h-8 mx-auto mb-6" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column - Invite Code Entry */}
          <motion.div
            className="order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Join Inkray
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your invite code to get started
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invite Code
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={inviteCode}
                      onChange={handleCodeChange}
                      placeholder="INK-XXXXXXXX"
                      className={`h-14 text-center text-xl font-mono tracking-wider ${
                        validationResult?.valid === false
                          ? "border-red-500 focus-visible:ring-red-500/50"
                          : validationResult?.valid
                          ? "border-green-500 focus-visible:ring-green-500/50"
                          : ""
                      }`}
                      disabled={isValidating || isSuccess}
                      autoComplete="off"
                      spellCheck={false}
                    />

                    {/* Validation indicator */}
                    <AnimatePresence>
                      {validationResult && (
                        <motion.div
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                        >
                          {validationResult.valid ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Error message */}
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
                  className="w-full h-12 text-base"
                  disabled={inviteCode.length !== 12 || isValidating || isSuccess}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Validating...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Welcome to Inkray!
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>

              {/* Success animation */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 rounded-2xl flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <motion.div
                        className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      >
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Code Accepted!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Redirecting to sign in...
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* How to Get an Invite */}
            <motion.div
              className="mt-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Don&apos;t have an invite?
              </h3>
              <div className="space-y-3">
                {getCodeMethods.map((method, index) => (
                  <motion.div
                    key={method.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    {method.link ? (
                      <a
                        href={method.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <method.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                            {method.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 p-3 rounded-xl">
                        <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <method.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {method.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Why Join */}
          <motion.div
            className="order-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-primary via-primary to-indigo-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Why join Inkray?
                </h2>
                <p className="text-white/80 mb-8">
                  The future of content creation is decentralized
                </p>

                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats or social proof */}
                <motion.div
                  className="mt-8 pt-6 border-t border-white/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-white/60 text-sm text-center">
                    Built on Sui • Powered by Walrus
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Additional info card */}
            <motion.div
              className="mt-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎟️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Invite-only for now
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We&apos;re launching with a limited community to ensure the best experience.
                    Once you join, you&apos;ll receive your own invite codes to share.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>© 2025 Inkray. All rights reserved.</p>
        </motion.footer>
      </div>
    </div>
  );
}
