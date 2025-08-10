import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Container } from "../MinimizedLauncher.styled.ts";

interface DraggableContainerProps {
  children: React.ReactNode;
  position: { x: number; y: number };
}

export const DraggableContainer: React.FC<DraggableContainerProps> = ({ children, position }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "minimized-launcher",
  });

  return (
    <Container
      ref={setNodeRef}
      $isDragging={isDragging}
      style={{ left: position.x, top: position.y }}
      {...listeners}
      {...attributes}
    >
      {children}
    </Container>
  );
};
