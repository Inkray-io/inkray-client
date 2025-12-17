import { cn } from "@/lib/utils";

type InfoBoxVariant = "info" | "warning" | "tip";

interface SettingsInfoBoxProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  children: React.ReactNode;
  variant?: InfoBoxVariant;
  className?: string;
}

const variantStyles: Record<InfoBoxVariant, { container: string; icon: string; title: string; content: string }> = {
  info: {
    container: "bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100/80",
    icon: "bg-blue-100 text-blue-600",
    title: "text-blue-900",
    content: "text-blue-700",
  },
  warning: {
    container: "bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100/80",
    icon: "bg-amber-100 text-amber-600",
    title: "text-amber-900",
    content: "text-amber-700",
  },
  tip: {
    container: "bg-gradient-to-br from-gray-50 to-slate-50/50 border-gray-200",
    icon: "bg-gray-100 text-gray-600",
    title: "text-gray-900",
    content: "text-gray-600",
  },
};

export function SettingsInfoBox({
  icon: Icon,
  title,
  children,
  variant = "info",
  className,
}: SettingsInfoBoxProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-xl p-4 border",
        styles.container,
        className
      )}
    >
      <div className="flex gap-3">
        {Icon && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            styles.icon
          )}>
            <Icon className="size-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn("font-medium text-sm mb-1", styles.title)}>
              {title}
            </p>
          )}
          <div className={cn("text-sm", styles.content)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
