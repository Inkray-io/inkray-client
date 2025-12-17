"use client";

import { cn } from "@/lib/utils";

interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className,
}: SettingsToggleProps) {
  const id = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className={cn(
            "text-base font-medium text-gray-900 cursor-pointer",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {label}
        </label>
        {description && (
          <p className={cn(
            "text-sm text-gray-500 mt-0.5",
            disabled && "opacity-60"
          )}>
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-gray-200",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
