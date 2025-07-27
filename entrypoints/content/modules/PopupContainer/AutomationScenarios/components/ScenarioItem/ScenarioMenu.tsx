import React from "react";
import { IconCopy, IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react";
import { Popover } from "antd";
import { MenuButton, MenuItemButton } from "../../styles.ts";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import { useScenarioActions } from "../../hooks/useScenarioActions";

interface ScenarioMenuProps {
  id: string;
  anyExecuting: boolean;
}

/**
 * Component for rendering the scenario menu with actions
 */
const ScenarioMenu: React.FC<ScenarioMenuProps> = ({ id, anyExecuting }) => {
  const { editScenario, deleteScenario, duplicateScenario } = useScenarioActions();
  return (
    <Popover
      content={
        <div className="flex flex-col gap-2">
          <MenuItemButton onClick={() => editScenario(id)} disabled={anyExecuting}>
            <IconEdit size={18} style={{ marginRight: "8px" }} />
            <span>Edit</span>
          </MenuItemButton>

          <MenuItemButton onClick={() => duplicateScenario(id)} disabled={anyExecuting}>
            <IconCopy size={18} style={{ marginRight: "8px" }} />
            <span>Duplicate</span>
          </MenuItemButton>

          <MenuItemButton onClick={() => deleteScenario(id)} disabled={anyExecuting}>
            <IconTrash size={18} style={{ marginRight: "8px" }} />
            <span>Delete</span>
          </MenuItemButton>
        </div>
      }
      getPopupContainer={() =>
        // @ts-ignore
        (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!
      }
      trigger="click"
      placement="bottomRight"
    >
      <span>
        <Tooltip title="More actions">
          <MenuButton className="ml-auto" disabled={anyExecuting}>
            <IconDotsVertical size={18} />
          </MenuButton>
        </Tooltip>
      </span>
    </Popover>
  );
};

export default ScenarioMenu;
