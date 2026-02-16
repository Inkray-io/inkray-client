"use client";

import { useState } from "react";
import { Lock, Star, Clock, Users, Shield } from "lucide-react";
import { SubscriptionButton } from "./SubscriptionButton";
import { log } from "@/lib/utils/Logger";

interface SubscriptionInfo {
  id: string;
  subscriptionPrice: number; // in MIST
  subscriptionPeriod: number; // in days
  publicationName?: string;
}

interface PublicationInfo {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  totalSubscribers?: number;
  totalArticles?: number;
}

interface SubscriptionPaywallProps {
  publicationInfo: PublicationInfo;
  subscriptionInfo: SubscriptionInfo;
  isSubscribed?: boolean;
  subscriptionExpiresAt?: Date;
  onSubscriptionSuccess?: () => void;
  articleTitle?: string;
  benefits?: string[];
}

export function SubscriptionPaywall({
  publicationInfo,
  subscriptionInfo,
  isSubscribed = false,
  subscriptionExpiresAt,
  onSubscriptionSuccess,
  articleTitle,
  benefits = [
    "Access to all gated articles",
    "Exclusive content and insights",
    "Support independent creators",
    "Ad-free reading experience"
  ]
}: SubscriptionPaywallProps) {
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

  log.debug('Subscription paywall props', {
    publicationInfo: {
      id: publicationInfo.id,
      name: publicationInfo.name,
    },
    subscriptionInfo: {
      id: subscriptionInfo.id,
      subscriptionPrice: subscriptionInfo.subscriptionPrice,
      subscriptionPriceType: typeof subscriptionInfo.subscriptionPrice,
      subscriptionPeriod: subscriptionInfo.subscriptionPeriod,
    },
    isSubscribed,
    formattedPrice: subscriptionInfo.subscriptionPrice ? (subscriptionInfo.subscriptionPrice / 1_000_000_000).toFixed(2) : 'N/A',
  }, 'SubscriptionPaywall');

  const formatPrice = (priceInMist: number) => {
    const suiPrice = (priceInMist / 1_000_000_000).toFixed(2);
    log.debug('Formatting price', {
      input: priceInMist,
      inputType: typeof priceInMist,
      output: suiPrice,
      calculation: `${priceInMist} / 1_000_000_000 = ${priceInMist / 1_000_000_000}`,
    }, 'SubscriptionPaywall');
    return suiPrice;
  };

  return (
    <div className="bg-white rounded-2xl p-8">
      <div className="text-center space-y-6">
        {/* Lock Icon */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-blue-600" />
        </div>

        {/* Main Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Gated Content
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {articleTitle 
              ? `"${articleTitle}" is available to subscribers of ${publicationInfo.name}`
              : `This content is available to subscribers of ${publicationInfo.name}`
            }
          </p>
        </div>

        {/* Publication Info */}
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            {publicationInfo.avatar ? (
              <img 
                src={publicationInfo.avatar} 
                alt={publicationInfo.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {publicationInfo.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{publicationInfo.name}</h3>
              {publicationInfo.description && (
                <p className="text-sm text-gray-600">{publicationInfo.description}</p>
              )}
            </div>
          </div>

          {/* Publication Stats */}
          <div className="flex justify-between text-sm text-gray-600 border-t pt-4">
            {publicationInfo.totalSubscribers !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{publicationInfo.totalSubscribers} subscribers</span>
              </div>
            )}
            {publicationInfo.totalArticles !== undefined && (
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>{publicationInfo.totalArticles} articles</span>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Benefits */}
        <div className="max-w-md mx-auto">
          <h4 className="font-semibold text-gray-900 mb-3">What you&apos;ll get:</h4>
          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-sm text-gray-700">
                <Star className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {formatPrice(subscriptionInfo.subscriptionPrice)} SUI
            </div>
            <div className="text-sm text-blue-700">
              per month • {subscriptionInfo.subscriptionPeriod} day access
            </div>
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="flex justify-center">
          <SubscriptionButton
            publicationId={publicationInfo.id}
            subscriptionInfo={subscriptionInfo}
            isSubscribed={isSubscribed}
            subscriptionExpiresAt={subscriptionExpiresAt}
            onSubscriptionSuccess={onSubscriptionSuccess}
            isOpen={isSubscriptionDialogOpen}
            onOpenChange={setIsSubscriptionDialogOpen}
            variant="inline"
          />
          
          {/* Manual trigger for inline dialog */}
          <button
            onClick={() => setIsSubscriptionDialogOpen(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {isSubscribed ? "Manage Subscription" : "Subscribe Now"}
          </button>
        </div>

        {/* Subscription Status */}
        {isSubscribed && subscriptionExpiresAt && (
          <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 justify-center text-green-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your subscription expires on {subscriptionExpiresAt.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-xs text-gray-500 space-y-1 max-w-md mx-auto border-t pt-4">
          <p>• Subscriptions are processed securely on the Sui blockchain</p>
          <p>• Cancel anytime • No hidden fees</p>
          <p>• Your payment directly supports the creator</p>
        </div>
      </div>
    </div>
  );
}