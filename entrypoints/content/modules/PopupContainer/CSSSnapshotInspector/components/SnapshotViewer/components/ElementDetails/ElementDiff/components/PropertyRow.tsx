import React from 'react';
import { IconPlus, IconMinus, IconArrowsExchange, IconCopy, IconCheck } from '@tabler/icons-react';
import {
  PropertyRowContainer,
  PropertyRowIcon,
  PropertyRowInfo,
  PropertyName,
  PropertyChangeType,
  PropertyValue,
  PropertyValueText,
  PropertyValueBadge,
  PropertyCopyButton
} from './styled';

interface PropertyRowData {
  property: string;
  value1: string | null;
  value2: string | null;
  changeType: 'added' | 'removed' | 'modified';
}

interface PropertyRowProps {
  row: PropertyRowData;
  index: number;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

const changeIcons = {
  added: <IconPlus size={14} className="text-green-600" />,
  removed: <IconMinus size={14} className="text-red-600" />,
  modified: <IconArrowsExchange size={14} className="text-blue-600" />
};

export const PropertyRow: React.FC<PropertyRowProps> = ({
  row,
  index,
  copied,
  onCopy
}) => {
  const { property, value1: oldVal, value2: newVal, changeType: kind } = row;

  const handleCopy = () => {
    const value = newVal || oldVal;
    if (value) {
      onCopy(`${property}: ${value};`, property);
    }
  };

  const renderValueBadge = (isOld: boolean) => {
    if (kind === 'added') {
      return <PropertyValueBadge $variant={isOld ? 'none' : 'new'}>
        {isOld ? 'None' : 'New'}
      </PropertyValueBadge>;
    }
    
    if (kind === 'removed') {
      return <PropertyValueBadge $variant={isOld ? 'was' : 'none'}>
        {isOld ? 'Was' : 'None'}
      </PropertyValueBadge>;
    }
    
    if (kind === 'modified') {
      return <PropertyValueBadge $variant={isOld ? 'old' : 'new'}>
        {isOld ? 'Old' : 'New'}
      </PropertyValueBadge>;
    }
    
    return null;
  };

  return (
    <PropertyRowContainer
      $variant={kind}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.0025 }}
    >
      <PropertyRowIcon>
        {changeIcons[kind]}
      </PropertyRowIcon>
      
      <PropertyRowInfo>
        <PropertyName title={property}>
          {property}
        </PropertyName>
        <PropertyChangeType>
          {kind}
        </PropertyChangeType>
      </PropertyRowInfo>

      {/* Snapshot 1 value */}
      <PropertyValue
        $hasValue={!!oldVal}
        $isOld={true}
        $changeType={kind}
        title={oldVal || "No value in snapshot 1"}
      >
        <PropertyValueText
          $changeType={kind}
          $isOld={true}
          $hasValue={!!oldVal}
        >
          {oldVal || "—"}
        </PropertyValueText>
        {renderValueBadge(true)}
      </PropertyValue>

      {/* Snapshot 2 value */}
      <PropertyValue
        $hasValue={!!newVal}
        $isOld={false}
        $changeType={kind}
        title={newVal || "No value in snapshot 2"}
      >
        <PropertyValueText
          $changeType={kind}
          $isOld={false}
          $hasValue={!!newVal}
        >
          {newVal || "—"}
        </PropertyValueText>
        {renderValueBadge(false)}
      </PropertyValue>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <PropertyCopyButton
          $copied={copied === property}
          aria-label="Copy property"
          onClick={handleCopy}
        >
          {copied === property ? <IconCheck size={14} /> : <IconCopy size={14} />}
        </PropertyCopyButton>
      </div>
    </PropertyRowContainer>
  );
};