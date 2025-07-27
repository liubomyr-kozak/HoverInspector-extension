import React from "react";
import { Button, Empty, List, Switch, Tag, Tooltip } from "antd";
import { IconCalendar, IconClock, IconEdit, IconTrash } from "@tabler/icons-react";
import { ScheduleConfig, ScheduleFrequency, ScheduleMap } from "../types.ts";
import { formatDistanceToNow } from "date-fns";

interface ScheduleListProps {
  schedules: ScheduleMap;
  activeScheduleId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}

/**
 * Component for rendering the list of schedules
 */
const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  activeScheduleId,
  onEdit,
  onDelete,
  onToggleEnabled,
}) => {
  // Sort schedule keys alphabetically by schedule title
  const scheduleKeys = Object.keys(schedules).sort((a, b) => schedules[a].title.localeCompare(schedules[b].title));

  if (scheduleKeys.length === 0) {
    return (
      <Empty
        description="No schedules found. Create a new schedule to get started."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Helper function to format the frequency for display
  const formatFrequency = (schedule: ScheduleConfig): string => {
    switch (schedule.frequency) {
      case ScheduleFrequency.ONCE:
        return "One-time";
      case ScheduleFrequency.DAILY:
        return "Daily";
      case ScheduleFrequency.WEEKLY:
        return "Weekly";
      case ScheduleFrequency.MONTHLY:
        return "Monthly";
      case ScheduleFrequency.CUSTOM:
        return `Every ${schedule.interval} minutes`;
      default:
        return "Unknown";
    }
  };

  // Helper function to format the next execution time
  const formatNextExecution = (schedule: ScheduleConfig): string => {
    if (!schedule.nextExecution) {
      return "Not scheduled";
    }

    try {
      const nextDate = new Date(schedule.nextExecution);
      return formatDistanceToNow(nextDate, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting next execution date:", error);
      return "Invalid date";
    }
  };

  return (
    <List
      itemLayout="horizontal"
      dataSource={scheduleKeys}
      renderItem={(key) => {
        const schedule = schedules[key];
        const isActive = key === activeScheduleId;

        return (
          <List.Item
            key={key}
            style={{
              backgroundColor: isActive ? "#e6f7ff" : "transparent",
              borderLeft: isActive ? "3px solid #1890ff" : "none",
              padding: "12px",
            }}
            actions={[
              <Tooltip title="Edit Schedule" key="edit">
                <Button type="text" icon={<IconEdit size={18} />} onClick={() => onEdit(key)} />
              </Tooltip>,
              <Tooltip title="Delete Schedule" key="delete">
                <Button type="text" danger icon={<IconTrash size={18} />} onClick={() => onDelete(key)} />
              </Tooltip>,
            ]}
          >
            <List.Item.Meta
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: "8px" }}>{schedule.title}</span>
                  <Switch
                    size="small"
                    checked={schedule.enabled}
                    onChange={(checked) => onToggleEnabled(key, checked)}
                  />
                  {!schedule.enabled && (
                    <Tag color="orange" style={{ marginLeft: "8px" }}>
                      Disabled
                    </Tag>
                  )}
                </div>
              }
              description={
                <div>
                  <div className="flex items-center" style={{ marginBottom: "4px" }}>
                    <IconCalendar size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                    <span style={{ marginRight: "12px" }}>{formatFrequency(schedule)}</span>
                    <IconClock size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                    <span>Next: {formatNextExecution(schedule)}</span>
                  </div>
                  {schedule.description && <div style={{ marginTop: "4px" }}>{schedule.description}</div>}
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

export default ScheduleList;
