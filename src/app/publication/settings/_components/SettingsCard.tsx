import { cn } from "@/lib/utils";

interface SettingsCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  title,
  description,
  action,
  children,
  className
}: SettingsCardProps) {
  const hasHeader = title || description || action;

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 p-5 sm:p-6",
      className
    )}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
