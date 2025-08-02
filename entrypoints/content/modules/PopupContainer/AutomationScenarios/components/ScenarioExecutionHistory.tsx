import React from "react";
import { Card, List, Space, Typography, Divider, Tag } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  MinusCircleOutlined
} from "@ant-design/icons";
import { ExecutionHistoryEntry, ExecutionStatus, ScenarioMap } from "../types";

const { Text, Title } = Typography;

interface ScenarioExecutionHistoryProps {
  executionHistory: Record<string, ExecutionHistoryEntry>;
  scenarios: ScenarioMap;
  currentExecutingScenarioId: string | null;
  executing: boolean;
  paused: boolean;
}

/**
 * Component for displaying the history of executed scenarios with their status
 */
const ScenarioExecutionHistory: React.FC<ScenarioExecutionHistoryProps> = ({
  executionHistory,
  scenarios,
  currentExecutingScenarioId,
  executing,
  paused,
}) => {
  // Get status icon based on status
  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case ExecutionStatus.ERROR:
        return <CloseCircleOutlined style={{ color: "#f5222d" }} />;
      case ExecutionStatus.RUNNING:
        return <LoadingOutlined style={{ color: "#1890ff" }} />;
      case ExecutionStatus.PAUSED:
        return <PauseCircleOutlined style={{ color: "#722ed1" }} />;
      case ExecutionStatus.CANCELLED:
        return <StopOutlined style={{ color: "#fa8c16" }} />;
      case ExecutionStatus.SKIPPED:
        return <MinusCircleOutlined style={{ color: "#8c8c8c" }} />;
      default:
        return <CloseCircleOutlined style={{ color: "#f5222d" }} />;
    }
  };

  // Get status tag based on status
  const getStatusTag = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        return <Tag color="success">Completed</Tag>;
      case ExecutionStatus.ERROR:
        return <Tag color="error">Failed</Tag>;
      case ExecutionStatus.RUNNING:
        return <Tag color="processing">Running</Tag>;
      case ExecutionStatus.PAUSED:
        return <Tag color="purple">Paused</Tag>;
      case ExecutionStatus.CANCELLED:
        return <Tag color="orange">Cancelled</Tag>;
      case ExecutionStatus.SKIPPED:
        return <Tag color="default">Skipped</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format duration to a readable format
  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = ((duration % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  };

  // Process execution history entries and currently executing scenario
  const processHistoryItems = () => {
    // Get all execution history entries sorted by execution time (newest first)
    const historyEntries = Object.values(executionHistory).sort(
      (a, b) => new Date(b.executionTime).getTime() - new Date(a.executionTime).getTime(),
    );
    
    // Create a copy of history entries to work with
    const historyItems = [...historyEntries];
    
    // If there's a currently executing scenario, handle it
    if (executing && currentExecutingScenarioId) {
      const currentScenario = scenarios[currentExecutingScenarioId];
      if (!currentScenario) return historyItems;
      
      // Check if the scenario is already in the history with RUNNING or PAUSED status
      const existingRunningEntryIndex = historyItems.findIndex(
        (entry) =>
          entry.scenarioId === currentExecutingScenarioId &&
          (entry.status === ExecutionStatus.RUNNING || entry.status === ExecutionStatus.PAUSED),
      );
      
      const currentStatus = paused ? ExecutionStatus.PAUSED : ExecutionStatus.RUNNING;
      
      if (existingRunningEntryIndex >= 0) {
        // Update the status of the existing entry if needed
        if (historyItems[existingRunningEntryIndex].status !== currentStatus) {
          historyItems[existingRunningEntryIndex] = {
            ...historyItems[existingRunningEntryIndex],
            status: currentStatus,
            log: {
              ...historyItems[existingRunningEntryIndex].log,
              status: currentStatus,
            },
          };
        }
        
        // Move the entry to the top if it's not already there
        if (existingRunningEntryIndex > 0) {
          const entry = historyItems.splice(existingRunningEntryIndex, 1)[0];
          historyItems.unshift(entry);
        }
      } else {
        // Add a new entry for the currently executing scenario
        historyItems.unshift({
          id: "current-execution",
          scenarioId: currentExecutingScenarioId,
          scenarioTitle: currentScenario.title,
          executionTime: new Date().toISOString(),
          duration: 0,
          status: currentStatus,
          stepsCompleted: 0,
          totalSteps: currentScenario.data.length * Math.max(1, currentScenario.repeat || 1),
          log: {
            entries: [],
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            totalDuration: 0,
            status: currentStatus,
          },
        });
      }
    }
    
    return historyItems;
  };
  
  // Get the history items to display
  const historyItems = processHistoryItems();

  if (historyItems.length === 0) {
    return null;
  }

  return (
    <Card 
      title={
        <Space>
          <HistoryOutlined />
          <span>Execution History</span>
        </Space>
      } 
      style={{ 
        marginBottom: "16px",
        borderLeft: "3px solid #1890ff"
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={historyItems}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: "12px 0",
              borderBottom: "1px solid #f0f0f0"
            }}
          >
            <List.Item.Meta
              avatar={getStatusIcon(item.status)}
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text strong>{item.scenarioTitle}</Text>
                  {getStatusTag(item.status)}
                </div>
              }
              description={
                <Space direction="vertical" size={0} style={{ width: "100%" }}>
                  <Text type="secondary">{formatTimestamp(item.executionTime)}</Text>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text type="secondary">
                      Steps: {item.stepsCompleted} / {item.totalSteps}
                    </Text>
                    {item.duration > 0 && (
                      <Text type="secondary">
                        Duration: {formatDuration(item.duration)}
                      </Text>
                    )}
                  </div>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default ScenarioExecutionHistory;