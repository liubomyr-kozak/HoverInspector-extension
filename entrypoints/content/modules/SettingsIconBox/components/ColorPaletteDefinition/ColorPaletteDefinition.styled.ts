import styled from "styled-components";

export const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #dadce0;
  margin-bottom: 16px;
`;

export const Tab = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${(props) => (props.active ? "#1a73e8" : "transparent")};
  color: ${(props) => (props.active ? "#1a73e8" : "#5f6368")};
  font-weight: ${(props) => (props.active ? "500" : "normal")};
  cursor: pointer;

  &:hover {
    color: #1a73e8;
  }
`;

export const TabContent = styled.div`
  min-height: 400px;
`;