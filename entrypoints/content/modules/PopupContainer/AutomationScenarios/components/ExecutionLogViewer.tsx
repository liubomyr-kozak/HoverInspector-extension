import React, { useState, useEffect } from 'react';
import { List, Tag, Typography, Timeline, Card, Collapse, Badge, Space, Tooltip, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  LoadingOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { ExecutionLog, ExecutionLogEntry, ExecutionStatus } from '../types';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ExecutionLogViewerProps {
  log: ExecutionLog | null;
  title?: string;
  showHeader?: boolean;
  maxHeight?: number;
}

/**
 * Component for displaying execution logs
 */
const ExecutionLogViewer: React.FC<ExecutionLogViewerProps> = ({
  log,
  title = 'Execution Log',
  showHeader = true,
  maxHeight = 400
}) => {
  const [expandedEntries, setExpandedEntries] = useState<string[]>([]);
  
  // Reset expanded entries when log changes
  useEffect(() => {
    setExpandedEntries([]);
  }, [log]);
  
  // If no log is provided, show a message
  if (!log) {
    return (
      <Card title={showHeader ? title : undefined}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <InfoCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
          <Paragraph>No execution log available.</Paragraph>
        </div>
      </Card>
    );
  }
  
  // Get status icon and color based on status
  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case ExecutionStatus.ERROR:
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case ExecutionStatus.WARNING:
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case ExecutionStatus.RUNNING:
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case ExecutionStatus.PAUSED:
        return <PauseCircleOutlined style={{ color: '#722ed1' }} />;
      case ExecutionStatus.CANCELLED:
        return <StopOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };
  
  // Get status tag based on status
  const getStatusTag = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        return <Tag color="success">Success</Tag>;
      case ExecutionStatus.ERROR:
        return <Tag color="error">Error</Tag>;
      case ExecutionStatus.WARNING:
        return <Tag color="warning">Warning</Tag>;
      case ExecutionStatus.RUNNING:
        return <Tag color="processing">Running</Tag>;
      case ExecutionStatus.PAUSED:
        return <Tag color="purple">Paused</Tag>;
      case ExecutionStatus.CANCELLED:
        return <Tag color="orange">Cancelled</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };
  
  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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
  
  // Handle entry expansion
  const handleEntryExpand = (entryId: string) => {
    if (expandedEntries.includes(entryId)) {
      setExpandedEntries(expandedEntries.filter(id => id !== entryId));
    } else {
      setExpandedEntries([...expandedEntries, entryId]);
    }
  };
  
  // Expand all entries
  const expandAll = () => {
    const allEntryIds = log.entries.map((_, index) => `entry-${index}`);
    setExpandedEntries(allEntryIds);
  };
  
  // Collapse all entries
  const collapseAll = () => {
    setExpandedEntries([]);
  };
  
  // Count entries by status
  const countByStatus = {
    success: log.entries.filter(entry => entry.status === ExecutionStatus.SUCCESS).length,
    error: log.entries.filter(entry => entry.status === ExecutionStatus.ERROR).length,
    warning: log.entries.filter(entry => entry.status === ExecutionStatus.WARNING).length
  };
  
  return (
    <Card 
      title={showHeader ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          <Space>
            <Button size="small" onClick={expandAll}>Expand All</Button>
            <Button size="small" onClick={collapseAll}>Collapse All</Button>
          </Space>
        </div>
      ) : undefined}
      extra={showHeader ? (
        <Space>
          <Badge count={countByStatus.success} style={{ backgroundColor: '#52c41a' }} overflowCount={999} />
          <Badge count={countByStatus.error} style={{ backgroundColor: '#f5222d' }} overflowCount={999} />
          <Badge count={countByStatus.warning} style={{ backgroundColor: '#faad14' }} overflowCount={999} />
          {getStatusTag(log.status)}
        </Space>
      ) : undefined}
    >
      <div style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
        <Timeline>
          {log.entries.map((entry, index) => (
            <Timeline.Item 
              key={index} 
              dot={getStatusIcon(entry.status)}
            >
              <Card 
                size="small" 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Step {entry.stepIndex + 1}: {entry.stepDescription}
                    </span>
                    <Space>
                      <Tooltip title={`Duration: ${formatDuration(entry.duration)}`}>
                        <Tag icon={<ClockCircleOutlined />}>{formatDuration(entry.duration)}</Tag>
                      </Tooltip>
                      {getStatusTag(entry.status)}
                    </Space>
                  </div>
                }
                style={{ 
                  marginBottom: '8px',
                  borderLeft: entry.status === ExecutionStatus.ERROR 
                    ? '3px solid #f5222d' 
                    : entry.status === ExecutionStatus.WARNING 
                      ? '3px solid #faad14' 
                      : undefined
                }}
                onClick={() => handleEntryExpand(`entry-${index}`)}
              >
                <Paragraph>{entry.details}</Paragraph>
                
                {(entry.error || entry.warning) && (
                  <Collapse 
                    activeKey={expandedEntries.includes(`entry-${index}`) ? [`panel-${index}`] : []}
                    ghost
                  >
                    <Panel 
                      header={
                        <Text type="secondary">
                          {entry.error ? 'Error details' : 'Warning details'}
                        </Text>
                      } 
                      key={`panel-${index}`}
                    >
                      {entry.error && (
                        <Paragraph type="danger">{entry.error}</Paragraph>
                      )}
                      {entry.warning && (
                        <Paragraph type="warning">{entry.warning}</Paragraph>
                      )}
                    </Panel>
                  </Collapse>
                )}
                
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatTimestamp(entry.timestamp)}
                </Text>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
        
        <Card size="small" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text>Started: {formatTimestamp(log.startTime)}</Text>
              <Text>Ended: {formatTimestamp(log.endTime)}</Text>
            </Space>
            <Space>
              <Text>Total Duration: {formatDuration(log.totalDuration)}</Text>
              {getStatusTag(log.status)}
            </Space>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default ExecutionLogViewer;