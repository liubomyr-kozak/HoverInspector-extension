import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 16px;
`;

export const Added = styled.span`
  background-color: #e6f4ea;
  color: #137333;
`;

export const Removed = styled.span`
  background-color: #fce8e6;
  color: #c5221f;
`;

export const Changed = styled.span`
  background-color: #fef7e0;
  color: #ea8600;
`;

export const FilterContainer = styled.div`
  margin-bottom: 16px;
`;

export const FilterInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #1a73e8;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #5f6368;
  text-align: center;

  svg {
    font-size: 48px;
    margin-bottom: 16px;
  }
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
