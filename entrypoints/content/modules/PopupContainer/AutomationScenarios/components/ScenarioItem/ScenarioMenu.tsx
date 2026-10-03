import React, { useState } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconFolder,
  IconFolderOff,
  IconFolderSymlink,
  IconTrash,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { selectScenarios } from "@entrypoints/content/store/automation/automation.slice.ts";
import { useScenarioFolders } from "../../hooks/useScenarioFolders";
import { getScenarioFolderId, groupScenariosByFolder } from "../../utils/folderUtils";
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
  const { folders, moveScenarioToFolder } = useScenarioFolders();
  const scenarios = useSelector(selectScenarios);
  const [open, setOpen] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const folderIds = Object.keys(folders);
  const currentFolderId = getScenarioFolderId(scenarios, folders, id);
  // Same order as the list
  const targets = [
    ...groupScenariosByFolder({}, folders).map((group) => ({ id: group.folderId, title: group.title })),
    { id: null as string | null, title: "No folder" },
  ];

  const moveTo = (folderId: string | null) => {
    setOpen(false);
    moveScenarioToFolder(id, folderId);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setShowFolders(false);
      }}
      content={
        <div className="flex flex-col gap-2" style={{ minWidth: 170, maxWidth: 240 }}>
          <MenuItemButton onClick={() => { setOpen(false); editScenario(id); }} disabled={anyExecuting}>
            <IconEdit size={18} style={{ marginRight: "8px" }} />
            <span>Edit</span>
          </MenuItemButton>

          <MenuItemButton onClick={() => { setOpen(false); duplicateScenario(id); }} disabled={anyExecuting}>
            <IconCopy size={18} style={{ marginRight: "8px" }} />
            <span>Duplicate</span>
          </MenuItemButton>

          {folderIds.length > 0 && (
            <MenuItemButton onClick={() => setShowFolders(!showFolders)} disabled={anyExecuting} aria-expanded={showFolders}>
              <IconFolderSymlink size={18} style={{ marginRight: "8px" }} />
              <span style={{ flex: 1, textAlign: "left" }}>Move to folder</span>
              {showFolders ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </MenuItemButton>
          )}
          {showFolders && (
            <div className="flex flex-col gap-1 pl-3" style={{ maxHeight: 180, overflowY: "auto" }} role="group" aria-label="Folders">
              {targets.map((target) => {
                const current = target.id === currentFolderId;
                const Icon = target.id ? IconFolder : IconFolderOff;
                return (
                  <MenuItemButton
                    key={target.id || "none"}
                    onClick={() => moveTo(target.id)}
                    disabled={anyExecuting || current}
                    title={target.title}
                  >
                    <Icon size={16} style={{ marginRight: "6px", flexShrink: 0 }} />
                    <span className="truncate" style={{ flex: 1, textAlign: "left" }}>
                      {target.title}
                    </span>
                    {current && <IconCheck size={14} style={{ flexShrink: 0 }} />}
                  </MenuItemButton>
                );
              })}
            </div>
          )}

          <MenuItemButton onClick={() => { setOpen(false); deleteScenario(id); }} disabled={anyExecuting}>
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
