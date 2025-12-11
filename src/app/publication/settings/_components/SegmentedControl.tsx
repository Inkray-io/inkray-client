import { cn } from "@/lib/utils";

interface SegmentedControlOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className
}: SegmentedControlProps) {
  return (
    <div className={cn(
      "inline-flex rounded-xl bg-gray-100 p-1",
      className
    )}>
      {options.map((option) => {
        const isActive = option.id === value;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {Icon && <Icon className="size-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
