import styled from 'styled-components';

/**
 * Styled components for the AutomationScenarios module
 */

export const Title = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
`;

export const ScenarioList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const ScenarioItem = styled.li<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  background-color: ${props => props.isActive ? '#e6f7ff' : 'transparent'};
  border-left: ${props => props.isActive ? '3px solid #1890ff' : 'none'};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${props => props.isActive ? '#e6f7ff' : '#f9f9f9'};
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
  
  &:hover {
    background-color: #f0f0f0;
    color: #333;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 24px;
  color: #999;
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