import React, { useEffect, useRef, useState } from "react";
import { Input, Popconfirm } from "antd";
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconFolderOff,
  IconFolderOpen,
  IconFolderPlus,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { MAX_FOLDER_TITLE_LENGTH, ScenarioFolderGroup } from "../utils/folderUtils";

const shadowBody = (): HTMLElement =>
  // @ts-ignore
  (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")!;

const iconButton =
  "flex items-center justify-center w-6 h-6 shrink-0 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 " +
  "dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed";

/**
 * Inline text field used to name a new folder or rename one. Enter saves, Esc cancels.
 * `onSubmit` resolves to an error message to show, or null when the name was saved.
 */
export const FolderNameInput: React.FC<{
  initialValue?: string;
  placeholder?: string;
  onSubmit: (title: string) => Promise<string | null>;
  onCancel: () => void;
}> = ({ initialValue = "", placeholder = "Folder name", onSubmit, onCancel }) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    inputRef.current?.focus({ cursor: "all" });
  }, []);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    const result = await onSubmit(value);
    setSaving(false);
    if (result) setError(result);
  };

  return (
    <div className="flex flex-col gap-0.5 w-full min-w-0" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1 w-full min-w-0">
        <Input
          ref={inputRef}
          size="small"
          value={value}
          maxLength={MAX_FOLDER_TITLE_LENGTH + 10}
          placeholder={placeholder}
          status={error ? "error" : undefined}
          aria-label={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            // Keep the page and the panel's own shortcuts from seeing the typing
            e.stopPropagation();
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          className="min-w-0 flex-1"
        />
        <button type="button" className={iconButton} onClick={submit} disabled={saving} title="Save" aria-label="Save">
          <IconCheck size={16} />
        </button>
        <button type="button" className={iconButton} onClick={onCancel} title="Cancel" aria-label="Cancel">
          <IconX size={16} />
        </button>
      </div>
      {error && <div className="text-xs text-red-500 pl-1">{error}</div>}
    </div>
  );
};

/**
 * Small toolbar above the list: a button that turns into a name field to create a folder
 */
export const NewFolderBar: React.FC<{ onCreate: (title: string) => Promise<string | null> }> = ({ onCreate }) => {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex items-center justify-end min-h-[28px] mb-1">
      {creating ? (
        <FolderNameInput
          placeholder="New folder name"
          onSubmit={async (title) => {
            const error = await onCreate(title);
            if (!error) setCreating(false);
            return error;
          }}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <button
          type="button"
          className="flex items-center gap-1 px-2 h-7 rounded text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => setCreating(true)}
          title="Create a folder"
        >
          <IconFolderPlus size={16} />
          New folder
        </button>
      )}
    </div>
  );
};

/**
 * Header row of a folder in the scenario list: collapse toggle, name, scenario count, rename and delete
 */
export const FolderHeader: React.FC<{
  group: ScenarioFolderGroup;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onRename: (title: string) => Promise<string | null>;
  onDelete: () => void;
}> = ({ group, open, disabled, onToggle, onRename, onDelete }) => {
  const [renaming, setRenaming] = useState(false);
  const isLoose = group.folderId === null;
  const count = group.scenarioIds.length;
  const FolderIcon = isLoose ? IconFolderOff : open ? IconFolderOpen : IconFolder;

  if (renaming) {
    return (
      <div className="flex items-center gap-1 px-1 py-1 border-b border-gray-100 dark:border-gray-700">
        <FolderNameInput
          initialValue={group.title}
          onSubmit={async (title) => {
            const error = await onRename(title);
            if (!error) setRenaming(false);
            return error;
          }}
          onCancel={() => setRenaming(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 px-1 h-8 border-b border-gray-100 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 select-none"
      data-folder-id={group.folderId || "none"}
    >
      {isLoose ? (
        <span className="w-6 shrink-0" />
      ) : (
        <button
          type="button"
          className={iconButton}
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? `Collapse ${group.title}` : `Expand ${group.title}`}
          title={open ? "Collapse" : "Expand"}
        >
          {open ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
        </button>
      )}
      <span
        className={`flex items-center gap-1.5 min-w-0 flex-1 text-[13px] font-medium text-gray-700 dark:text-gray-200 ${isLoose ? "" : "cursor-pointer"}`}
        onClick={isLoose ? undefined : onToggle}
        title={group.title}
      >
        <FolderIcon size={16} className="shrink-0 text-gray-500" />
        <span className="truncate">{group.title}</span>
        <span className="shrink-0 text-xs font-normal text-gray-400">{count}</span>
      </span>
      {!isLoose && (
        <>
          <button
            type="button"
            className={iconButton}
            onClick={() => setRenaming(true)}
            title="Rename folder"
            aria-label={`Rename ${group.title}`}
          >
            <IconPencil size={15} />
          </button>
          <Popconfirm
            title="Delete this folder?"
            description={
              count
                ? `Its ${count} scenario${count === 1 ? "" : "s"} will move to "No folder".`
                : "The folder is empty."
            }
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            placement="bottomRight"
            getPopupContainer={shadowBody}
            onConfirm={onDelete}
            disabled={disabled}
          >
            <button
              type="button"
              className={iconButton}
              disabled={disabled}
              title={disabled ? "Stop the running scenario first" : "Delete folder"}
              aria-label={`Delete ${group.title}`}
            >
              <IconTrash size={15} />
            </button>
          </Popconfirm>
        </>
      )}
    </div>
  );
};

/**
 * Shown inside an open folder that has no scenarios yet
 */
export const EmptyFolderHint: React.FC = () => (
  <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
    Empty. Use a scenario's ⋮ menu → Move to folder.
  </div>
);
