import React from 'react';
import {
  IconClick,
  IconPointer,
  IconCode,
  IconFunction,
  IconRefresh,
  IconReplace,
  IconClock,
  IconSelector,
  IconCheck,
  IconHandMove,
  IconEdit,
  IconArrowRight,
} from '@tabler/icons-react';
import { ScenarioStep } from '../types';

export interface StepIconProps {
  step: ScenarioStep;
  size?: number;
  className?: string;
}

/**
 * Get the appropriate icon component for a step type
 */
export const getStepIcon = (stepType: string, size: number = 16): React.ReactElement => {
  const iconProps = { size, style: { minWidth: size, minHeight: size } };

  switch (stepType) {
    case 'click':
      return <IconClick {...iconProps} />;
    case 'hover':
      return <IconPointer {...iconProps} />;
    case 'input':
      return <IconEdit {...iconProps} />;
    case 'value':
      return <IconReplace {...iconProps} />;
    case 'code':
      return <IconCode {...iconProps} />;
    case 'function':
      return <IconFunction {...iconProps} />;
    case 'redirect':
      return <IconArrowRight {...iconProps} />;
    case 'update':
      return <IconRefresh {...iconProps} />;
    case 'wait':
      return <IconClock {...iconProps} />;
    case 'select':
      return <IconSelector {...iconProps} />;
    case 'confirmation':
      return <IconCheck {...iconProps} />;
    default:
      return <IconHandMove {...iconProps} />;
  }
};

/**
 * Get the color associated with a step type
 */
export const getStepColor = (stepType: string): string => {
  switch (stepType) {
    case 'click':
      return '#52c41a'; // Green
    case 'hover':
      return '#1890ff'; // Blue
    case 'input':
      return '#722ed1'; // Purple
    case 'value':
      return '#722ed1'; // Purple
    case 'code':
      return '#fa8c16'; // Orange
    case 'function':
      return '#eb2f96'; // Pink
    case 'redirect':
      return '#1890ff'; // Blue
    case 'update':
      return '#13c2c2'; // Cyan
    case 'wait':
      return '#faad14'; // Yellow
    case 'select':
      return '#2f54eb'; // Indigo
    case 'confirmation':
      return '#52c41a'; // Green
    default:
      return '#1890ff'; // Default blue
  }
};

/**
 * Get emoji icon for a step type (fallback for simple display)
 */
export const getStepEmoji = (stepType: string): string => {
  switch (stepType) {
    case 'click':
      return '👆';
    case 'hover':
      return '🖱️';
    case 'input':
      return '⌨️';
    case 'value':
      return '✏️';
    case 'code':
      return '💻';
    case 'function':
      return '🔧';
    case 'redirect':
      return '🔄';
    case 'update':
      return '🔃';
    case 'wait':
      return '⏱️';
    case 'select':
      return '📋';
    case 'confirmation':
      return '✅';
    default:
      return '⚙️';
  }
};

/**
 * Step Icon Component with proper styling
 */
export const StepIcon: React.FC<StepIconProps> = ({ 
  step, 
  size = 16, 
  className = "" 
}) => {
  const color = getStepColor(step.type);
  const icon = getStepIcon(step.type, size);

  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color }}
      title={`${step.type} step`}
    >
      {icon}
    </span>
  );
};

/**
 * Enhanced Step Icon with animation support for current step
 */
export const AnimatedStepIcon: React.FC<StepIconProps & { 
  isActive?: boolean;
  isPulsing?: boolean;
}> = ({ 
  step, 
  size = 16, 
  className = "",
  isActive = false,
  isPulsing = false
}) => {
  const color = getStepColor(step.type);
  const icon = getStepIcon(step.type, size);

  const animationClass = isPulsing ? 'animate-pulse' : '';
  const activeClass = isActive ? 'ring-2 ring-offset-1 rounded-full' : '';
  
  return (
    <span 
      className={`inline-flex items-center justify-center transition-all duration-200 ${animationClass} ${activeClass} ${className}`}
      style={{ 
        color: isActive ? color : color + '80', // Add transparency when not active
        borderRadius: isActive ? '50%' : '0',
        boxShadow: isActive ? `0 0 0 2px ${color}40` : 'none'
      }}
      title={`${step.type} step${isActive ? ' (current)' : ''}`}
    >
      {icon}
    </span>
  );
};

export default {
  getStepIcon,
  getStepColor,
  getStepEmoji,
  StepIcon,
  AnimatedStepIcon,
};
