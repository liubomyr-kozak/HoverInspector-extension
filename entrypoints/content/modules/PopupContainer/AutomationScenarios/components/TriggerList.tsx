import React from 'react';
import { List, Switch, Tag, Tooltip, Button, Empty, Badge } from 'antd';
import { IconEdit, IconTrash, IconWorld, IconCode, IconEye } from '@tabler/icons-react';
import { TriggerMap, TriggerConfig, TriggerType } from '../types.ts';
import { formatDistanceToNow } from 'date-fns';

interface TriggerListProps {
  triggers: TriggerMap;
  activeTriggerID: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}

/**
 * Component for rendering the list of triggers
 */
const TriggerList: React.FC<TriggerListProps> = ({
  triggers,
  activeTriggerID,
  onEdit,
  onDelete,
  onToggleEnabled
}) => {
  // Sort trigger keys alphabetically by trigger title
  const triggerKeys = Object.keys(triggers).sort((a, b) => 
    triggers[a].title.localeCompare(triggers[b].title)
  );

  if (triggerKeys.length === 0) {
    return (
      <Empty 
        description="No triggers found. Create a new trigger to get started."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Helper function to get icon for trigger type
  const getTriggerTypeIcon = (type: TriggerType) => {
    switch (type) {
      case TriggerType.DOMAIN:
        return <IconWorld size={14} />;
      case TriggerType.PAGE_LOAD:
        return <IconWorld size={14} />;
      case TriggerType.ELEMENT_PRESENT:
        return <IconEye size={14} />;
      case TriggerType.CUSTOM_EVENT:
        return <IconCode size={14} />;
      default:
        return null;
    }
  };

  // Helper function to format trigger type for display
  const formatTriggerType = (type: TriggerType): string => {
    switch (type) {
      case TriggerType.DOMAIN:
        return 'Domain';
      case TriggerType.PAGE_LOAD:
        return 'Page Load';
      case TriggerType.ELEMENT_PRESENT:
        return 'Element Present';
      case TriggerType.CUSTOM_EVENT:
        return 'Custom Event';
      default:
        return 'Unknown';
    }
  };

  // Helper function to format the trigger condition for display
  const formatTriggerCondition = (trigger: TriggerConfig): string => {
    switch (trigger.type) {
      case TriggerType.DOMAIN:
        return `Domain: ${trigger.condition.domainPattern || 'Any'}${trigger.condition.exactMatch ? ' (Exact match)' : ''}`;
      case TriggerType.PAGE_LOAD:
        return 'On page load';
      case TriggerType.ELEMENT_PRESENT:
        return `Element: ${trigger.condition.elementXPath || 'Not specified'}`;
      case TriggerType.CUSTOM_EVENT:
        return `Event: ${trigger.condition.eventName || 'Not specified'}`;
      default:
        return 'Unknown condition';
    }
  };

  // Helper function to format the last triggered time
  const formatLastTriggered = (trigger: TriggerConfig): string => {
    if (!trigger.lastTriggered) {
      return 'Never triggered';
    }
    
    try {
      const lastDate = new Date(trigger.lastTriggered);
      return formatDistanceToNow(lastDate, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting last triggered date:', error);
      return 'Invalid date';
    }
  };

  return (
    <List
      itemLayout="horizontal"
      dataSource={triggerKeys}
      renderItem={key => {
        const trigger = triggers[key];
        const isActive = key === activeTriggerID;
        
        return (
          <List.Item
            key={key}
            style={{ 
              backgroundColor: isActive ? '#e6f7ff' : 'transparent',
              borderLeft: isActive ? '3px solid #1890ff' : 'none',
              padding: '12px'
            }}
            actions={[
              <Tooltip title="Edit Trigger" key="edit">
                <Button 
                  type="text" 
                  icon={<IconEdit size={18} />} 
                  onClick={() => onEdit(key)}
                />
              </Tooltip>,
              <Tooltip title="Delete Trigger" key="delete">
                <Button 
                  type="text" 
                  danger
                  icon={<IconTrash size={18} />} 
                  onClick={() => onDelete(key)}
                />
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>{trigger.title}</span>
                  <Switch 
                    size="small" 
                    checked={trigger.enabled} 
                    onChange={(checked) => onToggleEnabled(key, checked)}
                  />
                  {!trigger.enabled && (
                    <Tag color="orange" style={{ marginLeft: '8px' }}>Disabled</Tag>
                  )}
                  {trigger.lastTriggered && (
                    <Badge 
                      status="success" 
                      text={`Last triggered: ${formatLastTriggered(trigger)}`} 
                      style={{ marginLeft: '8px' }}
                    />
                  )}
                </div>
              }
              description={
                <div>
                  <div>
                    {getTriggerTypeIcon(trigger.type)}
                    <span style={{ marginLeft: '4px', marginRight: '8px' }}>
                      {formatTriggerType(trigger.type)}
                    </span>
                    <span>{formatTriggerCondition(trigger)}</span>
                  </div>
                  {trigger.description && (
                    <div style={{ marginTop: '4px' }}>{trigger.description}</div>
                  )}
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

export default TriggerList;