/**
 * Snapshot list: one compact row per snapshot.
 *
 * - Clicking a row opens its details.
 * - The checkbox selects it for comparison (at most two); the footer bar then offers Compare.
 * - Compare with the current page sits on the row on hover; everything else is in the row's ⋮ menu.
 * - Rename happens in place; Delete asks for confirmation in place.
 */
import React, { memo, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Input, Popover } from "antd";
import {
  IconBrowser,
  IconCamera,
  IconCheck,
  IconDotsVertical,
  IconDownload,
  IconEye,
  IconGitCompare,
  IconPencil,
  IconPhotoPlus,
  IconSparkles,
  IconSquareDot,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { CSSSnapshot } from "./types";
import { EmptyState } from "@entrypoints/shared/components/EmptyState";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { tokens } from "@entrypoints/shared/styles/tokens";
import {
  formatSnapshotDateTime,
  formatSnapshotTime,
  getSnapshotKind,
  getSnapshotLocation,
  getSnapshotName,
  MAX_SNAPSHOT_NAME_LENGTH,
} from "./utils/snapshotLabels";

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg}px;
  overflow: hidden;
  background: ${tokens.color.surface};
`;

const ListCaption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 2px 6px;
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textMuted};

  strong {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

/** Shown on hover and keyboard focus only, so idle rows stay one clean line */
const HoverActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 120ms ease;
`;

/** A or B, as the compare view will label the two selected snapshots (same colours as its header) */
const SideTag = styled.span<{ $side: "A" | "B" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: ${tokens.radius.sm}px;
  font-size: 11px;
  font-weight: 700;
  background: ${(p) => (p.$side === "A" ? "#fee2e2" : "#dcfce7")};
  color: ${(p) => (p.$side === "A" ? "#b91c1c" : tokens.color.success)};
`;

const Row = styled.li<{ $selected: boolean; $confirming: boolean; $disabled?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 6px 6px 6px 10px;
  border-bottom: 1px solid ${tokens.color.border};
  background: ${(p) => (p.$confirming ? tokens.color.dangerBg : p.$selected ? tokens.color.primaryBg : tokens.color.surface)};
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  transition: background-color 120ms ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(p) => (p.$confirming ? tokens.color.dangerBg : p.$selected ? "#dbeafe" : tokens.color.surfaceMuted)};
  }

  &:hover ${HoverActions}, &:focus-within ${HoverActions} {
    opacity: 1;
  }
`;

const Check = styled.input`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: ${tokens.color.primary};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`;

const KindIcon = styled.span<{ $kind: string }>`
  display: inline-flex;
  flex-shrink: 0;
  color: ${(p) => (p.$kind === "element" ? "#7c3aed" : tokens.color.textSecondary)};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const NameLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Name = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${tokens.font.size.sm}px;
  font-weight: 500;
  color: ${tokens.color.text};
`;

const Time = styled.span`
  flex-shrink: 0;
  font-size: ${tokens.font.size.xs}px;
  font-variant-numeric: tabular-nums;
  color: ${tokens.color.textMuted};
`;

const Meta = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textMuted};
`;

const ConfirmText = styled.span`
  flex: 1;
  min-width: 0;
  font-size: ${tokens.font.size.sm}px;
  color: ${tokens.color.danger};
  font-weight: 500;
`;

const TextButton = styled.button<{ $danger?: boolean }>`
  height: ${tokens.control.sm}px;
  padding: 0 10px;
  border-radius: ${tokens.radius.md}px;
  font-size: ${tokens.font.size.xs}px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${(p) => (p.$danger ? tokens.color.danger : tokens.color.borderStrong)};
  background: ${(p) => (p.$danger ? tokens.color.danger : tokens.color.surface)};
  color: ${(p) => (p.$danger ? "#fff" : tokens.color.text)};

  &:hover {
    background: ${(p) => (p.$danger ? tokens.color.dangerHover : tokens.color.surfaceMuted)};
  }
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 200px;
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: ${tokens.radius.md}px;
  background: transparent;
  font-size: ${tokens.font.size.sm}px;
  text-align: left;
  color: ${(p) => (p.$danger ? tokens.color.danger : tokens.color.text)};
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$danger ? tokens.color.dangerBg : "#f3f4f6")};
  }

  svg {
    flex-shrink: 0;
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  margin: 4px 0;
  background: ${tokens.color.border};
`;

type RowMenuAction = "current" | "rename" | "export" | "delete";

/** The row's ⋮ menu (same Popover pattern as the automation scenario menu) */
const RowMenu: React.FC<{ name: string; withCurrent: boolean; onAction: (action: RowMenuAction) => void }> = ({
  name,
  withCurrent,
  onAction,
}) => {
  const [open, setOpen] = useState(false);
  const item = (action: RowMenuAction, icon: React.ReactNode, label: string, danger = false) => (
    <MenuItem
      type="button"
      role="menuitem"
      $danger={danger}
      onClick={() => {
        setOpen(false);
        onAction(action);
      }}
    >
      {icon}
      <span>{label}</span>
    </MenuItem>
  );
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 4 }}
      content={
        <MenuList role="menu" aria-label={`Actions for ${name}`}>
          {withCurrent && item("current", <IconGitCompare size={16} />, "Compare with current page")}
          {item("rename", <IconPencil size={16} />, "Rename")}
          {item("export", <IconDownload size={16} />, "Export as JSON")}
          <MenuDivider />
          {item("delete", <IconTrash size={16} />, "Delete", true)}
        </MenuList>
      }
    >
      <span className="inline-flex">
        <IconButton label={`Actions for ${name}`} size={28} aria-haspopup="menu" aria-expanded={open}>
          <IconDotsVertical />
        </IconButton>
      </span>
    </Popover>
  );
};

const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

interface SnapshotManagerProps {
  readonly snapshots: readonly CSSSnapshot[];
  readonly compareSnapshots: readonly CSSSnapshot[];
  readonly onView: (snapshot: CSSSnapshot) => void;
  readonly onDelete: (id: string) => void;
  readonly onExport: (snapshot: CSSSnapshot) => void;
  readonly onRename: (id: string, name: string) => Promise<boolean>;
  readonly onToggleCompare: (snapshot: CSSSnapshot) => void;
  readonly onCompareWithCurrentPage?: (snapshot: CSSSnapshot) => void;
  /** Empty state shortcuts */
  readonly onCapture?: () => void;
  readonly onPickElement?: () => void;
  /** True when the list is filtered by search (changes the empty state text) */
  readonly isFiltered?: boolean;
  /** Number of saved snapshots before filtering */
  readonly totalCount?: number;
}

const RenameField: React.FC<{
  initialValue: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}> = ({ initialValue, onSave, onCancel }) => {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<any>(null);
  useEffect(() => {
    ref.current?.focus({ cursor: "all" });
  }, []);
  const save = () => (value.trim() ? onSave(value) : onCancel());
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
      <Input
        ref={ref}
        size="small"
        value={value}
        maxLength={MAX_SNAPSHOT_NAME_LENGTH}
        aria-label="Snapshot name"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Keep the page and the panel's shortcuts from seeing the typing
          e.stopPropagation();
          if (e.key === "Enter") save();
          if (e.key === "Escape") onCancel();
        }}
        className="min-w-0 flex-1"
      />
      <IconButton label="Save name" size={24} onClick={save}>
        <IconCheck />
      </IconButton>
      <IconButton label="Cancel renaming" size={24} onClick={onCancel}>
        <IconX />
      </IconButton>
    </div>
  );
};

export const SnapshotManager = memo<SnapshotManagerProps>(
  ({
    snapshots,
    compareSnapshots,
    onView,
    onDelete,
    onExport,
    onRename,
    onToggleCompare,
    onCompareWithCurrentPage,
    onCapture,
    onPickElement,
    isFiltered = false,
    totalCount,
  }) => {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    if (snapshots.length === 0) {
      return (
        <EmptyState
          icon={<IconPhotoPlus />}
          title={isFiltered ? "No matching snapshots" : "No snapshots yet"}
          description={
            isFiltered
              ? "No snapshot name, address or date matches your search."
              : "Save the computed styles of the whole page or of one element, then compare them later or with the live page."
          }
          action={
            !isFiltered && (onCapture || onPickElement) ? (
              <EmptyActions>
                {onCapture && (
                  <TextButton type="button" onClick={onCapture} className="inline-flex items-center gap-1">
                    <IconSparkles size={14} /> Snapshot page
                  </TextButton>
                )}
                {onPickElement && (
                  <TextButton type="button" onClick={onPickElement} className="inline-flex items-center gap-1">
                    <IconCamera size={14} /> Pick element
                  </TextButton>
                )}
              </EmptyActions>
            ) : undefined
          }
        />
      );
    }

    const selectedIds = new Set(compareSnapshots.map((s) => s.id));
    const selectionFull = compareSnapshots.length >= 2;
    // The compare view always puts the older snapshot on side A, so the tags match what it will show
    const sideOf = (snapshot: CSSSnapshot): "A" | "B" | null => {
      if (!selectedIds.has(snapshot.id) || compareSnapshots.length < 2) return null;
      const other = compareSnapshots.find((s) => s.id !== snapshot.id);
      return other && other.timestamp < snapshot.timestamp ? "B" : "A";
    };

    const onMenu = (snapshot: CSSSnapshot, key: RowMenuAction) => {
      switch (key) {
        case "current":
          return onCompareWithCurrentPage?.(snapshot);
        case "rename":
          setConfirmDeleteId(null);
          return setRenamingId(snapshot.id);
        case "export":
          return onExport(snapshot);
        case "delete":
          setRenamingId(null);
          return setConfirmDeleteId(snapshot.id);
      }
    };

    const shown = snapshots.length;
    const total = totalCount ?? shown;

    return (
      <div>
        <ListCaption>
          <span>
            <strong>Snapshots</strong> {shown === total ? total : `${shown} of ${total}`}
          </span>
          {shown > 1 && (
            <span aria-live="polite">
              {compareSnapshots.length === 0
                ? "Click two snapshots to compare"
                : compareSnapshots.length === 1
                  ? "Click one more to compare"
                  : "Ready to compare"}
            </span>
          )}
        </ListCaption>
        <List aria-label="Saved snapshots">
          {snapshots.map((snapshot) => {
            const selected = selectedIds.has(snapshot.id);
            const kind = getSnapshotKind(snapshot);
            const name = getSnapshotName(snapshot);
            const location = getSnapshotLocation(snapshot.url);
            const count = snapshot.elementCount || 0;
            const meta = `${kind === "element" ? "Element" : "Page"} · ${location} · ${count} ${count === 1 ? "element" : "elements"}`;
            const renaming = renamingId === snapshot.id;
            const confirming = confirmDeleteId === snapshot.id;
            const checkDisabled = !selected && selectionFull;
            const side = sideOf(snapshot);

            return (
              <Row
                key={snapshot.id}
                $selected={selected}
                $confirming={confirming}
                data-snapshot-id={snapshot.id}
                $disabled={checkDisabled}
                title={checkDisabled ? "Two snapshots are selected. Untick one to pick another." : undefined}
                // Clicking a row selects it for comparison; details have their own button
                onClick={() => {
                  if (!renaming && !confirming && !checkDisabled) onToggleCompare(snapshot);
                }}
              >
                <Check
                  type="checkbox"
                  checked={selected}
                  disabled={checkDisabled}
                  aria-label={`Select ${name} for comparison`}
                  title={checkDisabled ? "Two snapshots are already selected" : "Select for comparison"}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleCompare(snapshot)}
                />
                <KindIcon $kind={kind} title={kind === "element" ? "Element snapshot" : "Page snapshot"}>
                  {kind === "element" ? <IconSquareDot size={18} /> : <IconBrowser size={18} />}
                </KindIcon>

                {confirming ? (
                  <>
                    <ConfirmText>Delete “{name}”?</ConfirmText>
                    <RowActions onClick={(e) => e.stopPropagation()}>
                      <TextButton type="button" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </TextButton>
                      <TextButton
                        type="button"
                        $danger
                        onClick={() => {
                          setConfirmDeleteId(null);
                          onDelete(snapshot.id);
                        }}
                      >
                        Delete
                      </TextButton>
                    </RowActions>
                  </>
                ) : renaming ? (
                  <RenameField
                    initialValue={name}
                    onCancel={() => setRenamingId(null)}
                    onSave={async (value) => {
                      if (await onRename(snapshot.id, value)) setRenamingId(null);
                    }}
                  />
                ) : (
                  <>
                    <Body>
                      <NameLine>
                        {side && (
                          <SideTag $side={side} aria-label={side === "A" ? "Side A, before" : "Side B, after"}>
                            {side}
                          </SideTag>
                        )}
                        <Name title={name}>{name}</Name>
                      </NameLine>
                      {/* The time sits with the details so a narrow panel keeps the name readable */}
                      <Meta title={`${formatSnapshotDateTime(snapshot.timestamp)} · ${snapshot.url}`}>
                        <Time>{formatSnapshotTime(snapshot.timestamp)}</Time> · {meta}
                      </Meta>
                    </Body>
                    <RowActions onClick={(e) => e.stopPropagation()}>
                      {onCompareWithCurrentPage && (
                        <HoverActions>
                          <IconButton
                            label="Compare with current page"
                            size={28}
                            onClick={() => onCompareWithCurrentPage(snapshot)}
                          >
                            <IconGitCompare />
                          </IconButton>
                        </HoverActions>
                      )}
                      <IconButton label={`View details of ${name}`} size={28} onClick={() => onView(snapshot)}>
                        <IconEye />
                      </IconButton>
                      <RowMenu
                        name={name}
                        withCurrent={!!onCompareWithCurrentPage}
                        onAction={(action) => onMenu(snapshot, action)}
                      />
                    </RowActions>
                  </>
                )}
              </Row>
            );
          })}
        </List>
      </div>
    );
  },
);
