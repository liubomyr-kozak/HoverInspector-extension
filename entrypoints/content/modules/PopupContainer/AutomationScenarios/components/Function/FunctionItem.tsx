import React from "react";
import { IconCode, IconEdit, IconTrash } from "@tabler/icons-react";
import { CustomFunction } from "../../types.ts";
import { ActionButton, ScenarioActions, ScenarioItem as StyledFunctionItem, ScenarioTitle } from "../../styles.ts";

interface FunctionItemProps {
  id: string;
  customFunction: CustomFunction;
  isActive: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Component for rendering an individual function item in the list
 */
const FunctionItem: React.FC<FunctionItemProps> = ({ id, customFunction, isActive, onEdit, onDelete }) => {
  return (
    <StyledFunctionItem isActive={isActive}>
      <ScenarioTitle>
        {customFunction.title}
        <span style={{ marginLeft: "8px", color: "#888", fontSize: "12px" }}>(Function)</span>
      </ScenarioTitle>
      <ScenarioActions>
        <ActionButton onClick={() => onEdit(id)} title="Edit Function">
          <IconCode size={18} color={isActive ? "#1890ff" : undefined} />
        </ActionButton>
        <ActionButton onClick={() => onEdit(id)} title="Edit">
          <IconEdit size={18} />
        </ActionButton>
        <ActionButton onClick={() => onDelete(id)} title="Delete">
          <IconTrash size={18} />
        </ActionButton>
      </ScenarioActions>
    </StyledFunctionItem>
  );
};

export default FunctionItem;
