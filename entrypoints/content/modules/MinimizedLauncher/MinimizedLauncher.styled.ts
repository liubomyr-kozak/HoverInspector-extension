import styled from "styled-components";

export const Container = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  border: none;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;

  &:hover {
    background: linear-gradient(135deg, #6b74ea 0%, #7a4aa3 100%);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

export const FeatureContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
`;

export const MainButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
`;

export const QuickAction = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

export const RestoreButton = styled(QuickAction)`
  border-radius: 6px;
  padding: 4px;
  margin-left: auto;
`;

export const DragHandle = styled.div`
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  margin-right: 4px;
  cursor: move;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const RecordingIndicator = styled.div<{ status: "idle" | "recording" | "active" }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ status }) => (status === "recording" ? "#ff4757" : status === "active" ? "#2ecc71" : "#bdc3c7")};
  animation: ${({ status }) => (status === "recording" ? "pulse 2s infinite" : "none")};

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
`;
