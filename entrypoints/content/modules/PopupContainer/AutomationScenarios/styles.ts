import styled from "styled-components";

/**
 * Styled components for the AutomationScenarios module
 */

export const ScenarioList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const ScenarioItem = styled.li.withConfig({
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  background-color: ${(props) => (props.isActive ? "#e6f7ff" : "transparent")};
  border-left: ${(props) => (props.isActive ? "3px solid #1890ff" : "none")};

  gap: 20px;
  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${(props) => (props.isActive ? "#e6f7ff" : "#f9f9f9")};
  }
`;

export const ScenarioTitle = styled.span`
  flex: 1;
  font-size: 14px;
  color: #333;
`;

export const ScenarioActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
`;

export const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
    color: #333;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PlayButton = styled(ActionButton)`
  opacity: 1;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
`;

export const PauseResumeButton = styled(ActionButton)<{ paused: boolean }>`
  background-color: ${(props) => (props.paused ? "#52c41a" : "#fa8c16")};
  border: 1px solid;
  border-color: ${(props) => (props.paused ? "#3da008" : "#d48806")};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${(props) => (props.paused ? "#3da008" : "#d48806")};
  }
`;

export const NextStepButton = styled(ActionButton)<{ disabled: boolean }>`
  background-color: ${(props) => (props.disabled ? "#f5f5f5" : "#1890ff")};
  border: 1px solid;
  border-color: ${(props) => (props.disabled ? "#d9d9d9" : "#096dd9")};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: ${(props) => (props.disabled ? "#bfbfbf" : "white")};
  font-weight: 500;
  box-shadow: ${(props) => (props.disabled ? "none" : "0 1px 2px rgba(0,0,0,0.1)")};

  &:hover {
    background-color: #096dd9;
  }
`;

export const StopButton = styled(ActionButton)`
  background-color: #f5222d;
  border: 1px solid #cf1322;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #cf1322;
  }
`;

export const MenuButton = styled(ActionButton)`
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  border: 1px solid #d9d9d9;
  border-radius: 4px;

  &:active,
  &:focus {
    opacity: 1;
    visibility: visible;
    outline: none;
    background-color: #f0f0f0;
    color: #333;
  }
`;

export const MenuItemButton = styled(ActionButton)`
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  justify-content: flex-start;
  width: 100%;
  border-radius: 4px;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 24px;
  color: #6b7280;
`;

export const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 16px;
  cursor: pointer;
  color: #333;
  font-size: 14px;

  &:hover {
    background-color: #e0e0e0;
  }
`;

export const StepContainer = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

export const StepTitle = styled.span`
  font-weight: bold;
  margin-right: 8px;
`;

export const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

export const RecordingNotificationContainer = styled.div`
  padding: 8px 12px;
  margin-bottom: 16px;
  background-color: #fff2e8;
  border: 1px solid #ffbb96;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const RecordingText = styled.span`
  color: #fa541c;
  font-weight: bold;
  display: flex;
  font-size: 14px;

  .animate-combined {
    animation:
      rotate 2s infinite linear,
      pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    animation-delay: 1s, 0s;
  }

  svg {
    position: relative;
    top: 1px;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

export const AutomationFooterContainer = styled.div`
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 0 0 1px #a8bbd6;
  background: #f7f8f9;
  width: 100%;
`;
