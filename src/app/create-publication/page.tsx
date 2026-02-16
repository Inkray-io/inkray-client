"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicationFlow, type SponsorStep } from "@/hooks/usePublicationFlow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  BookOpen,
  Users,
  Sparkles,
  Zap,
  Hammer,
  Gift,
  PenTool,
  Rocket,
  Check,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { setCachedPublication } from "@/lib/cache-manager";
import { log } from "@/lib/utils/Logger";

/** Get step configuration for the progress indicator */
function getStepConfig(step: SponsorStep) {
  const steps = {
    idle: { label: "Ready", icon: BookOpen, index: 0 },
    building: { label: "Building transaction", icon: Hammer, index: 1 },
    sponsoring: { label: "Getting gas sponsorship", icon: Gift, index: 2 },
    signing: { label: "Sign with your wallet", icon: PenTool, index: 3 },
    executing: { label: "Executing on chain", icon: Rocket, index: 4 },
  };
  return steps[step] || steps.idle;
}

/** Progress step component */
function ProgressStep({
  label,
  icon: Icon,
  isActive,
  isComplete,
}: {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`
          relative flex items-center justify-center w-8 h-8 rounded-full
          transition-all duration-300 ease-out
          ${
            isComplete
              ? "bg-green-500 text-white"
              : isActive
                ? "bg-primary text-white ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
          }
        `}
      >
        {isComplete ? (
          <Check className="w-4 h-4" />
        ) : (
          <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
        )}
      </div>
      <span
        className={`
          text-sm font-medium transition-colors duration-200
          ${isActive ? "text-foreground" : "text-muted-foreground"}
        `}
      >
        {label}
      </span>
    </div>
  );
}

export default function CreatePublicationPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const {
    createPublication,
    isCreating,
    error,
    clearError,
    getUserPublications,
    sponsorStep,
    isSponsored,
  } = usePublicationFlow();

  const [publicationName, setPublicationName] = useState('');
  const [hasExistingPublications, setHasExistingPublications] = useState(false);
  const [isCheckingPublications, setIsCheckingPublications] = useState(true);

  // Check if user already has publications
  useEffect(() => {
    if (isAuthenticated) {
      checkExistingPublications();
    }
  }, [isAuthenticated]);

  const checkExistingPublications = async () => {
    try {
      setIsCheckingPublications(true);
      const publications = await getUserPublications();
      setHasExistingPublications(publications.length > 0);

      // If user already has publications, redirect to create article
      if (publications.length > 0) {
        toast({
          title: "Publication Found",
          description: "You already have a publication. Redirecting to article creation.",
        });
        setTimeout(() => router.push('/create'), 1500);
      }
    } catch (error) {
      log.error('Failed to check existing publications', { error }, 'CreatePublicationPage');
    } finally {
      setIsCheckingPublications(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a publication name.",
        variant: "destructive",
      });
      return;
    }

    try {
      clearError();
      const result = await createPublication(publicationName.trim());

      toast({
        title: "Success",
        description: `Publication "${publicationName}" created successfully!`,
      });

      // Store publication info with package ID validation
      setCachedPublication({
        publicationId: result.publicationId,
        vaultId: result.vaultId,
        ownerCapId: result.ownerCapId,
        name: publicationName,
      });

      // Redirect to article creation
      setTimeout(() => router.push('/create'), 1500);

    } catch (error) {
      toast({
        title: "Publication Creation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isCheckingPublications) {
    return (
      <RequireAuth redirectTo="/">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Checking your publications...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (hasExistingPublications) {
    return (
      <RequireAuth redirectTo="/">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Publication Found!</h1>
            <p className="text-muted-foreground">
              You already have a publication. Redirecting to article creation...
            </p>
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth redirectTo="/">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-slate-900 rounded-lg shadow-lg border">
          <div className="mb-4">
            <BackButton />
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create Your Publication
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up your publication to start writing articles
            </p>
          </div>

          {/* Gas-Free Badge */}
          <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
                  Gas-Free Creation
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  We sponsor your transaction — no SUI needed!
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What you&apos;ll get:
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Your own decentralized publication</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Ability to manage contributors</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Full ownership of your content</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="publicationName">
                Publication Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="publicationName"
                type="text"
                placeholder="My Amazing Publication"
                value={publicationName}
                onChange={(e) => setPublicationName(e.target.value)}
                required
                maxLength={100}
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose a name for your publication (max 100 characters)
              </p>
            </div>

            {/* Progress Indicator - shown during creation */}
            {isCreating && isSponsored && (
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Creating your publication...</span>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <div className="space-y-2">
                  {(
                    [
                      { step: "building", label: "Building transaction", icon: Hammer },
                      { step: "sponsoring", label: "Getting gas sponsorship", icon: Gift },
                      { step: "signing", label: "Sign with your wallet", icon: PenTool },
                      { step: "executing", label: "Executing on chain", icon: Rocket },
                    ] as const
                  ).map(({ step, label, icon }, index) => {
                    const currentStepIndex = getStepConfig(sponsorStep).index;
                    const stepIndex = index + 1;
                    return (
                      <ProgressStep
                        key={step}
                        label={label}
                        icon={icon}
                        isActive={sponsorStep === step}
                        isComplete={currentStepIndex > stepIndex}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isCreating || !publicationName.trim()}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isSponsored
                    ? getStepConfig(sponsorStep).label
                    : "Creating Publication..."}
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Publication
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              This will create a publication on the Sui blockchain.
              {isAuthenticated && (
                <span className="block mt-1 text-emerald-600 dark:text-emerald-400">
                  Gas fees are sponsored — you won&apos;t pay anything!
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}