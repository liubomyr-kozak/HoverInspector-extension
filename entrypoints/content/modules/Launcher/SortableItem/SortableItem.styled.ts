import styled from "styled-components";

export const DraggableItem = styled.div`
  padding: 4px;
  border: 1px dashed #ccc;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DragHandle = styled.div`
  cursor: grab;
  display: flex;
  align-items: center;
  width: 100%;
`;

export const DragHandleIcon = styled.div`
  display: flex;
  align-items: center;

  svg {
    width: 14px;
  }
`;

export const DragFeatureIcon = styled.div`
  display: flex;
  align-items: center;
`;

export const DragFeatureTitle = styled.div`
  margin: 0 10px;
`;

export const EyeIconContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: 8px;
  cursor: pointer;
  margin-left: auto;

  svg {
    width: 18px;
    height: 18px;
  }
`;
