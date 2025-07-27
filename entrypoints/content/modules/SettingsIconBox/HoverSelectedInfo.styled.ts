import styled from "styled-components";

export const SettingTab = styled.div``;

export const SettingTabHeader = styled.div`
  display: block;
`;

export const TabContainer = styled.div<{ active?: boolean }>`
  display: ${({ active }) => (active ? "block" : "none")};

  div {
    font-size: 13px !important;
  }
`;

export const CssGroup = styled.div`
  margin: 8px 0;
`;

export const CssGroupToggle = styled.span<{ $expanded: boolean }>`
  width: 100%;
  text-align: left;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;

  &::before {
    content: "${(props) => (props.$expanded ? "▶" : "▼")}";
    font-size: 12px;
    color: #151515;
    pointer-events: none;
    user-select: none;
  }
`;

export const CssDetails = styled.div`
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
