import styled from "styled-components";

export const CssKey = styled.span`
    color: #2ceef9;
`;

export const CssValue = styled.span<{ muted?: boolean }>`
    color: ${({muted}) => (muted ? "#999" : "#000")};
    font-style: ${({muted}) => (muted ? "italic" : "normal")};
    opacity: ${({muted}) => (muted ? 0.6 : 1)};
`;

export const CssRow = styled.div`
    display: flex;
    justify-content: flex-start;
    padding: 2px 0;
    gap: 8px;
    line-height: 1.4;
`;

