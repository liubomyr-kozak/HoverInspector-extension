import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 16px;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const Button = styled.button`
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background-color: #1765cc;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const DangerButton = styled(Button)`
  background-color: #d93025;

  &:hover {
    background-color: #b7271f;
  }
`;

export const SecondaryButton = styled(Button)`
  background-color: #f1f3f4;
  color: #202124;

  &:hover {
    background-color: #e8eaed;
  }
`;

export const Content = styled.div`
  flex: 1;
`;

export const SnapshotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SnapshotItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid #dadce0;
  border-radius: 4px;

  &:hover {
    background-color: #f1f3f4;
  }
`;

export const SnapshotInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const SnapshotTitle = styled.div`
  font-weight: 500;
`;

export const SnapshotMeta = styled.div`
  font-size: 12px;
  color: #5f6368;
`;

export const SnapshotActions = styled.div`
  display: flex;
  gap: 4px;
`;

export const ComparisonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ComparisonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ComparisonTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
`;

export const ComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: 4px 6px;
  background-color: #f1f3f4;
  border: 1px solid #dadce0;
  font-size: 13px;
`;

export const TableCell = styled.td`
  padding: 4px 6px;
  border: 1px solid #dadce0;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
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
