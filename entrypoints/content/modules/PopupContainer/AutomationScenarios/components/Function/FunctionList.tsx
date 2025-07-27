import React from "react";
import { FunctionMap } from "../../types.ts";
import { EmptyState, ScenarioList as StyledFunctionList } from "../../styles.ts";
import FunctionItem from "./FunctionItem.tsx";

interface FunctionListProps {
  functions: FunctionMap;
  activeFunctionId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Component for rendering the list of custom functions
 */
const FunctionList: React.FC<FunctionListProps> = ({ functions, activeFunctionId, onEdit, onDelete }) => {
  const functionKeys = Object.keys(functions).sort((a, b) => functions[a].title.localeCompare(functions[b].title));

  if (functionKeys.length === 0) {
    return <EmptyState>No functions found. Create a new one to get started.</EmptyState>;
  }

  return (
    <StyledFunctionList>
      {functionKeys.map((key) => (
        <FunctionItem
          key={key}
          id={key}
          customFunction={functions[key]}
          isActive={key === activeFunctionId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </StyledFunctionList>
  );
};

export default FunctionList;
