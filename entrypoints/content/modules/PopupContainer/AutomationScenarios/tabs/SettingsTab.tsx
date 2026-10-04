import React from "react";
import { LiveWatchToggle } from "../liveWatch/components/LiveWatchToggle";

/**
 * Settings of the Automation tool. Live watching lives here, not under the scenario list: it is a
 * setting you change once, and the list stays about scenarios.
 */
const SettingsTab: React.FC = () => (
  <div className="flex flex-col gap-3">
    <LiveWatchToggle />
  </div>
);

export default SettingsTab;
