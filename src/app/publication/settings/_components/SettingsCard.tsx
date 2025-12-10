import { cn } from "@/lib/utils";

interface SettingsCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 p-5 sm:p-6",
      className
    )}>
      {children}
    </div>
  );
}
