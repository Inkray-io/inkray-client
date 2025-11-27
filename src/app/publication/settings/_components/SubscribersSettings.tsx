import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";

interface SubscribersSettingsProps {
  publicationId: string;
}

export function SubscribersSettings({ publicationId: _publicationId }: SubscribersSettingsProps) {
  return (
    <SettingsSection
      title="Subscribers"
      description="Manage your publication subscribers and their access."
    >
      <SettingsCard>
        <p className="text-muted-foreground">Subscriber management coming soon...</p>
      </SettingsCard>
    </SettingsSection>
  );
}
