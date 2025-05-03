import styled from "styled-components";

export const BetaBadge = styled.span`
    display: inline-block;
    background: linear-gradient(135deg, #ff7e5f, #feb47b); // градієнт
    color: white;
    font-size: 10px;
    font-weight: bold;
    border-radius: 6px;
    padding: 2px 8px;
    text-transform: uppercase;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
    user-select: none;
`;