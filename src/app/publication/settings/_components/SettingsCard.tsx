import { cn } from "@/lib/utils";

interface SettingsCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-4 sm:p-6",
      className
    )}>
      {children}
    </div>
  );
}
