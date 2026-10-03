import React, { useMemo, useState } from "react";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { diffElement, type ElementLike, type ValueChange } from "../../../../utils/elementChanges";

interface ElementChangesProps {
  /** The element in snapshot A; null when it is only in B */
  before: ElementLike | null;
  /** The element in snapshot B; null when it is only in A */
  after: ElementLike | null;
}

const COLOR_VALUE = /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\()/i;

const SideTag: React.FC<{ side: "A" | "B" }> = ({ side }) => (
  <span
    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold ${
      side === "A" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
    }`}
    aria-label={side === "A" ? "Before" : "After"}
  >
    {side}
  </span>
);

const Value: React.FC<{ value?: string; fallback: string }> = ({ value, fallback }) =>
  value === undefined ? (
    <span className="italic text-gray-500">{fallback}</span>
  ) : (
    <span className="inline-flex min-w-0 items-center gap-1 break-all">
      {COLOR_VALUE.test(value) && (
        <span className="h-3 w-3 shrink-0 rounded-sm border border-gray-300" style={{ background: value }} aria-hidden />
      )}
      {value}
    </span>
  );

const ChangeList: React.FC<{ title: string; changes: ValueChange[]; fallback: string }> = ({ title, changes, fallback }) =>
  changes.length === 0 ? null : (
    <section className="space-y-1.5">
      <h6 className="m-0 text-xs font-semibold text-gray-700">{title}</h6>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {changes.map((change) => (
          <li key={change.name} className="rounded-md border border-gray-200 px-2 py-1.5 font-mono text-xs">
            <div className="text-gray-900">{change.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-700">
              <span className="inline-flex min-w-0 items-center gap-1">
                <SideTag side="A" />
                <Value value={change.before} fallback={fallback} />
              </span>
              <span className="text-gray-500" aria-hidden>
                →
              </span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <SideTag side="B" />
                <Value value={change.after} fallback={fallback} />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

/**
 * The details popup in a comparison: only what changed on this element from A to B, so a class that
 * turns the background red reads as "background-color: default → rgb(239, 68, 68)" instead of a full
 * list of computed styles.
 */
export const ElementChanges: React.FC<ElementChangesProps> = ({ before, after }) => {
  const changes = useMemo(() => diffElement(before, after), [before, after]);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const summary = !before
    ? "Only in B: the element was added."
    : !after
      ? "Only in A: the element was removed."
      : changes.total === 0
        ? "No differences between A and B."
        : `${changes.total} ${changes.total === 1 ? "change" : "changes"} from A to B.`;

  return (
    <div className="space-y-3 text-sm">
      <p className="m-0 text-gray-700" role="status">
        {summary}
      </p>

      {(changes.classesAdded.length > 0 || changes.classesRemoved.length > 0) && (
        <section className="space-y-1.5">
          <h6 className="m-0 text-xs font-semibold text-gray-700">Classes</h6>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {changes.classesAdded.map((c) => (
              <span key={`+${c}`} className="rounded bg-green-50 px-1.5 py-0.5 text-green-800">
                + {c}
              </span>
            ))}
            {changes.classesRemoved.map((c) => (
              <span key={`-${c}`} className="rounded bg-red-50 px-1.5 py-0.5 text-red-700 line-through">
                − {c}
              </span>
            ))}
          </div>
        </section>
      )}

      <ChangeList title="Styles" changes={changes.styles} fallback="default" />
      <ChangeList title="Size and position" changes={changes.box} fallback="—" />
      <ChangeList title="Inline styles" changes={changes.inlineStyles} fallback="not set" />
      <ChangeList title="Attributes" changes={changes.attributes} fallback="not set" />

      {changes.unchangedStyles.length > 0 && (
        <section>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded px-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            aria-expanded={showUnchanged}
            onClick={() => setShowUnchanged((v) => !v)}
          >
            {showUnchanged ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            Unchanged styles ({changes.unchangedStyles.length})
          </button>
          {showUnchanged && (
            <ul className="m-0 mt-1 list-none space-y-0.5 p-0 font-mono text-xs text-gray-600">
              {changes.unchangedStyles.map(([name, value]) => (
                <li key={name} className="break-all">
                  <span className="text-gray-900">{name}</span>: {value}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
