"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { invitesAPI, InviteCodesResponse, InviteStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Loader2,
  Copy,
  Check,
  Users,
  Gift,
  TrendingUp,
  Share2,
  ChevronRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { useToast } from "@/hooks/use-toast";

export default function InvitesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<InviteCodesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch invite codes
  useEffect(() => {
    const fetchInviteCodes = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await invitesAPI.getMyCodes();
        const responseData = response.data.data || response.data;
        setData(responseData);
      } catch (error) {
        console.error("Failed to fetch invite codes:", error);
        toast({
          title: "Error",
          description: "Failed to load your invite codes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchInviteCodes();
    }
  }, [isAuthenticated, toast]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const shareOnTwitter = (code: string) => {
    const text = `Join me on Inkray - the decentralized publishing platform where you truly own your content!\n\nUse my invite code: ${code}\n\nhttps://inkray.xyz/invite?code=${code}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const copyShareLink = async (code: string) => {
    const link = `https://inkray.xyz/invite?code=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout currentPage="invites">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout currentPage="invites">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Failed to load invite codes</p>
        </div>
      </AppLayout>
    );
  }

  const { available, used, expired, stats } = data;

  // Helper to calculate expiration info
  const getExpirationInfo = (expiresAt: string | null) => {
    if (!expiresAt) return null;

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const totalDays = 7; // Total expiration period
    const progress = Math.max(0, Math.min(100, (diffDays / totalDays) * 100));

    return {
      daysLeft: Math.max(0, diffDays),
      hoursLeft: Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60))),
      progress,
      isUrgent: diffDays <= 2,
      isExpiringSoon: diffDays <= 3,
    };
  };

  return (
    <AppLayout currentPage="invites">
      <div className="max-w-4xl py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Invites</h1>
          <p className="text-muted-foreground">
            Share Inkray with friends and grow your network
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsCard
            icon={Gift}
            label="Available"
            value={stats.availableCodes}
            color="text-green-500"
            bgColor="bg-green-100 dark:bg-green-900/30"
          />
          <StatsCard
            icon={Users}
            label="Invited"
            value={stats.usedCodes}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatsCard
            icon={TrendingUp}
            label="Total Codes"
            value={stats.totalCodes}
            color="text-purple-500"
            bgColor="bg-purple-100 dark:bg-purple-900/30"
          />
          {stats.nextMilestone && (
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs text-muted-foreground">Next Goal</span>
              </div>
              <p className="text-sm font-medium">
                {stats.nextMilestone.current}/{stats.nextMilestone.target}{" "}
                {stats.nextMilestone.type}
              </p>
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (stats.nextMilestone.current / stats.nextMilestone.target) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Available Codes */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-500" />
            Available Codes
          </h2>

          {available.length > 0 ? (
            <div className="grid gap-3">
              {available.map((invite, index) => {
                const expirationInfo = getExpirationInfo(invite.expiresAt);

                return (
                  <motion.div
                    key={invite.id}
                    className="bg-card border rounded-xl p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                          <span className="text-white text-xl">🎟️</span>
                        </div>
                        <div>
                          <p className="font-mono text-lg font-semibold tracking-wider">
                            {invite.code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Earned via {invite.earnedVia.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(invite.code)}
                          className="gap-2"
                        >
                          {copiedCode === invite.code ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyShareLink(invite.code)}
                          className="gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareOnTwitter(invite.code)}
                          className="gap-2"
                        >
                          <FaXTwitter className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expiration Progress Bar */}
                    {expirationInfo && (
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {expirationInfo.isUrgent ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                expirationInfo.isUrgent
                                  ? "text-red-500"
                                  : expirationInfo.isExpiringSoon
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {expirationInfo.daysLeft === 0
                                ? `${expirationInfo.hoursLeft}h left`
                                : expirationInfo.daysLeft === 1
                                ? "1 day left"
                                : `${expirationInfo.daysLeft} days left`}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Expires {new Date(invite.expiresAt!).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              expirationInfo.isUrgent
                                ? "bg-red-500"
                                : expirationInfo.isExpiringSoon
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${expirationInfo.progress}%` }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground mb-2">No available codes</p>
              <p className="text-sm text-muted-foreground">
                Earn more by reaching milestones or wait for weekly bonuses
              </p>
            </div>
          )}
        </motion.div>

        {/* Used Codes / Invited Users */}
        {used.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              People You&apos;ve Invited ({used.length})
            </h2>

            <div className="bg-card border rounded-xl divide-y dark:divide-gray-800">
              {used.map((invite, index) => (
                <motion.div
                  key={invite.id}
                  className="p-4 flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  {invite.usedBy?.avatar ? (
                    <img
                      src={invite.usedBy.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {invite.usedBy?.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {invite.usedBy?.username || "Anonymous User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {invite.usedBy?.publicKey
                        ? `${invite.usedBy.publicKey.slice(0, 6)}...${invite.usedBy.publicKey.slice(-4)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Joined{" "}
                      {invite.usedAt
                        ? new Date(invite.usedAt).toLocaleDateString()
                        : ""}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {invite.code}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Expired Codes */}
        {expired && expired.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Expired Codes ({expired.length})</span>
            </h2>

            <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl p-4 opacity-60">
              <div className="grid gap-2">
                {expired.slice(0, 3).map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">🎟️</span>
                      </div>
                      <span className="font-mono text-sm text-gray-500 line-through">
                        {invite.code}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Expired {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
                {expired.length > 3 && (
                  <p className="text-xs text-center text-gray-400 pt-2">
                    +{expired.length - 3} more expired codes
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* How to Earn More */}
        <motion.div
          className="mt-8 bg-gradient-to-br from-primary/5 to-indigo-500/5 border rounded-xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-semibold mb-4">How to earn more invite codes</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span>📝</span>
              </div>
              <div>
                <p className="font-medium">Publish articles</p>
                <p className="text-muted-foreground">
                  Reach 5, 10, 25, 50 articles for bonus codes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span>👥</span>
              </div>
              <div>
                <p className="font-medium">Grow your audience</p>
                <p className="text-muted-foreground">
                  Reach 10, 50, 100, 500 followers for bonus codes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span>📆</span>
              </div>
              <div>
                <p className="font-medium">Weekly bonus</p>
                <p className="text-muted-foreground">
                  Stay active to receive weekly invite codes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span>🎁</span>
              </div>
              <div>
                <p className="font-medium">Special events</p>
                <p className="text-muted-foreground">
                  Participate in community events for bonus codes
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
