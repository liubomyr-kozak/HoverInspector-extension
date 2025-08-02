import styled from "styled-components";

// Details overlay component
export const DetailsOverlay = styled.div`
  position: fixed;
  top: 50px;
  right: 20px;
  width: 500px;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: auto;
  padding: 16px;
  border: 1px solid #e0e0e0;
  
  @media (max-height: 700px) {
    top: 10px;
  }
`;

// Details header component
export const DetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`;

// Close button component
export const CloseButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f5f5f5;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #e0e0e0;
  }
`;
