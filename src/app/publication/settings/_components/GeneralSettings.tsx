import { SettingsSection } from "./SettingsSection";
import { SettingsCard } from "./SettingsCard";

interface GeneralSettingsProps {
  publicationId: string;
}

export function GeneralSettings({ publicationId: _publicationId }: GeneralSettingsProps) {
  return (
    <SettingsSection
      title="General Settings"
      description="Manage basic publication information and settings."
    >
      <SettingsCard>
        <p className="text-muted-foreground">General settings coming soon...</p>
      </SettingsCard>
    </SettingsSection>
  );
}
