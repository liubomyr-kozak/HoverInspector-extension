import { tokens } from "@entrypoints/shared/styles/tokens";
import styled from "styled-components";
import { Tag } from "antd";

/**
 * Styled components for the ScenarioItem component
 */

export const ExpandedContent = styled.div`
  padding: 0 16px 16px 16px;
  background-color: #f9f9f9;
  border-top: 1px solid #f0f0f0;
  margin-bottom: 8px;
  border-radius: 0 0 4px 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
`;

export const ProgressContainer = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
`;

export const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const ProgressText = styled.span`
  font-size: 13px;
  color: #666;
`;

export const StepsHeading = styled.h4`
  margin-bottom: 12px;
  color: #1890ff;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding-top: 12px;
`;

export const StepsHeadingText = styled.span`
  margin-right: 8px;
`;

export const StepCount = styled.span`
  font-size: 12px;
  color: #888;
  font-weight: normal;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 10px;
`;

export const StepsList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

export const StepItem = styled.li<{ isActive?: boolean; isSearched?: boolean; borderColor?: string }>`
  padding: 8px 12px;
  background-color: ${(props) => (props.isActive ? "#e6f7ff" : props.isSearched ? "#fff7e6" : "white")};
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-left: 3px solid ${(props) => props.borderColor || "#1890ff"};
  transition: all 0.2s ease;
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  justify-content: space-between;
`;

export const StepInfo = styled.div`
  display: flex;
  align-items: center;
`;

export const StepNumber = styled.span`
  margin-right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 50%;
  font-size: 12px;
`;

export const StepIconWrapper = styled.span`
  margin-right: 6px;
`;

export const StepDescription = styled.span<{ color?: string }>`
  color: ${(props) => props.color || "#1890ff"};
  margin-right: 8px;
`;

export const StepActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const StepStatusContainer = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`;

export const StepStatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const StepStatusText = styled.span`
  font-size: 12px;
  color: #666;
`;

export const StepValueContainer = styled.div`
  font-size: 13px;
  color: #333;
  background-color: #f9f9f9;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  word-break: break-word;
`;

export const StepValueLabel = styled.span`
  color: #888;
  margin-right: 4px;
`;

export const StepXPathContainer = styled.div`
  font-size: 12px;
  color: #666;
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 4px 4px 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  overflow: auto;
  max-width: 100%;
  display: flex;
  align-items: center;
`;

export const StepXPathLabel = styled.span`
  color: #888;
  margin-right: 4px;
`;

export const StepDetails = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

export const StepErrorContainer = styled.div`
  font-size: 12px;
  color: #f5222d;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #fff1f0;
  border-radius: 4px;
  border: 1px solid #ffccc7;
`;

export const StepWarning = styled.div`
  font-size: 12px;
  color: #faad14;
  margin-top: 2px;
`;

// The inline form of a step of a saved scenario: the same card as an open step of the scenario form
export const EditingStepItem = styled.li`
  margin-top: 12px;
  padding: 12px 14px 14px;
  border: 1px solid ${tokens.color.primaryBorder};
  border-radius: 10px;
  background: ${tokens.color.surface};
  list-style: none;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 10px 24px -10px rgba(15, 23, 42, 0.18);
`;

export const EditingStepHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const EditingStepTitle = styled.span`
  font-size: ${tokens.font.size.xs}px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${tokens.color.textSecondary};
`;

export const StatusTag = styled(Tag)`
  margin-left: 8px;
`;

export const EmptyStatusIcon = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #d9d9d9;
`;

export const StepItemWrapper = styled.div`
  position: relative;

  &:last-child {
    margin-bottom: 8px;
  }
`;

export const StepInsertContainer = styled.div`
  position: relative;
  height: 0;
  margin: 0;
  padding: 5px 0;
  display: flex;
  justify-content: center;
  z-index: 5;
  transition:
    opacity 0.15s ease-in,
    transform 0.2s ease,
    background-color 0.2s ease;

  &:hover > div {
    opacity: 1;
  }

  &:hover::before {
    opacity: 1;
  }

  /* Create a larger hover area to make it easier to trigger */
  &::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 2px;
    top: 3px;
    left: 0;
    opacity: 0;
    background-color: #1890ff;
    border-radius: 5px;
  }
`;

export const StepInsertButton = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transform: translateY(-12px);
  /* Faster opacity transition to make it appear more quickly */

  /* Make the button more visible on hover */
  &:hover {
    background-color: #40a9ff;
    transform: translateY(-12px) scale(1.1);
    /* Ensure it's fully visible on direct hover */
    opacity: 1 !important;
  }

  /* Keep the button visible when focused/clicked */
  &:focus,
  &:active {
    opacity: 1;
    outline: none;
    /* Add a subtle glow effect when focused/active */
    box-shadow:
      0 0 0 3px rgba(24, 144, 255, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;
