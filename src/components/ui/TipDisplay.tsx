"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MIST_PER_SUI } from "@/constants/tipping";

interface TipDisplayProps {
  amount: number; // Amount in MIST
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
}

export function TipDisplay({ amount, className, showIcon = true, size = "default" }: TipDisplayProps) {
  // Convert MIST to SUI using constant
  const suiAmount = amount / MIST_PER_SUI;
  
  // Format display based on amount
  const formatAmount = (sui: number): string => {
    if (sui === 0) return "0";
    if (sui < 0.1) return sui.toFixed(3);
    if (sui < 1) return sui.toFixed(2);
    if (sui < 10) return sui.toFixed(1);
    return Math.floor(sui).toString();
  };

  const sizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Always show tip display to indicate tipping is available

  return (
    <div className={cn(
      "inline-flex items-center gap-1 text-red-600",
      sizeClasses[size],
      className
    )}>
      {showIcon && <Heart className={cn("fill-current", iconSizes[size])} />}
      <span className="font-medium">
        {formatAmount(suiAmount)} SUI
      </span>
    </div>
  );
}