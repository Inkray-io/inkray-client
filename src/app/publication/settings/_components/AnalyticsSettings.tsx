import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";

interface AnalyticsSettingsProps {
  publicationId: string;
}

export function AnalyticsSettings({ publicationId: _publicationId }: AnalyticsSettingsProps) {
  return (
    <SettingsSection
      title="Analytics"
      description="View publication performance and subscriber metrics."
    >
      <SettingsCard>
        <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
      </SettingsCard>
    </SettingsSection>
  );
}
