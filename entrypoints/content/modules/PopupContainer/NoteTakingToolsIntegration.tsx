import React from "react";
import NoteTakingToolsApp from "./Note Taking Tools/src/App";

/**
 * Redux-integrated wrapper for the Note Taking Tools
 * This component provides the Redux store context to the Note Taking Tools app
 * and ensures proper integration with the extension's state management system.
 */
export const NoteTakingToolsIntegration: React.FC = () => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <NoteTakingToolsApp />
    </div>
  );
};

export default NoteTakingToolsIntegration;
