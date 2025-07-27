import React, { useEffect } from "react";
import { Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";

// Import types
import { ExecutionHistoryEntry } from "../types";

// Import Redux actions and selectors
import {
  selectCurrentExecutionLog,
  selectExecutionHistory,
  selectExecutionHistoryLoading,
  selectScenarios,
} from "../../../../store/automation/automation.slice";
// Import saga actions
import {
  deleteExecutionHistoryWatcher,
  loadExecutionHistoryWatcher,
  loadScenariosWatcher,
} from "../../../../store/automation/automation.saga.action";

// Import components
import ExecutionHistoryViewer from "../components/ExecutionHistory/ExecutionHistoryViewer.tsx";

/**
 * ExecutionHistoryTab Component
 *
 * This component handles the Execution History tab in the AutomationScenarios component.
 * It provides UI for viewing, filtering, and managing execution history entries.
 */
const ExecutionHistoryTab: React.FC = () => {
  // Redux hooks
  const dispatch = useDispatch();
  const executionHistory = useSelector(selectExecutionHistory);
  const executionHistoryLoading = useSelector(selectExecutionHistoryLoading);
  const currentExecutionLog = useSelector(selectCurrentExecutionLog);
  const scenarios = useSelector(selectScenarios);

  // Load execution history and scenarios when component mounts
  useEffect(() => {
    dispatch(loadExecutionHistoryWatcher.getPayload());
    dispatch(loadScenariosWatcher.getPayload());
  }, [dispatch]);

  // Handler functions
  const refreshExecutionHistory = () => {
    dispatch(loadExecutionHistoryWatcher.getPayload());
  };

  const deleteExecutionHistory = (id: string) => {
    dispatch(deleteExecutionHistoryWatcher.getPayload(id));
  };

  const exportExecutionHistory = (entry: ExecutionHistoryEntry) => {
    try {
      // Create a JSON string from the entry
      const jsonString = JSON.stringify(entry, null, 2);

      // Create a blob from the JSON string
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `execution-history-${entry.id}.json`;

      // Append the link to the document
      document.body.appendChild(link);

      // Click the link to download the file
      link.click();

      // Remove the link from the document
      document.body.removeChild(link);

      // Revoke the URL to free up memory
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting execution history entry:", error);
    }
  };

  const exportAllExecutionHistory = (entries: ExecutionHistoryEntry[]) => {
    try {
      // Create a JSON string from the entries
      const jsonString = JSON.stringify(entries, null, 2);

      // Create a blob from the JSON string
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `execution-history-${new Date().toISOString()}.json`;

      // Append the link to the document
      document.body.appendChild(link);

      // Click the link to download the file
      link.click();

      // Remove the link from the document
      document.body.removeChild(link);

      // Revoke the URL to free up memory
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting execution history entries:", error);
    }
  };
  return (
    <>
      {executionHistoryLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <Spin tip="Loading execution history..." size="large" />
        </div>
      ) : (
        <ExecutionHistoryViewer
          executionHistory={executionHistory}
          onRefresh={refreshExecutionHistory}
          onDelete={deleteExecutionHistory}
          onExport={exportExecutionHistory}
          onExportAll={exportAllExecutionHistory}
          scenarios={scenarios}
        />
      )}
    </>
  );
};

export default ExecutionHistoryTab;
