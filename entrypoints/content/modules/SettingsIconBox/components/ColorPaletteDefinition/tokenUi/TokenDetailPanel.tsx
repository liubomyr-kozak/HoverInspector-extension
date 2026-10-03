import React from "react";
import { IconX } from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import type { ThemeMatch } from "../utils/themeDiff";
import { CopyChip, CopyField } from "./CopyField";
import { MatchLine } from "./MatchBadge";
import { NodeList } from "./NodeList";

export interface DetailFormat {
  label: string;
  value: string;
  /** Spans both columns (long values: shadows, font shorthand) */
  wide?: boolean;
}

export interface DetailName {
  /** "CSS variable", "Class", "Theme token", "Role" */
  kind: string;
  text: string;
  /** What the chip copies, when it differs from the text (var(--x)) */
  copy?: string;
}

export interface TokenDetail {
  preview: React.ReactNode;
  title: string;
  subtitle?: string;
  formats: DetailFormat[];
  /** Section title above the formats */
  formatsTitle?: string;
  /** Kind-specific facts under the formats (contrast, grid) */
  extra?: React.ReactNode;
  names: DetailName[];
  elements: Element[];
  /** null: no theme tokens of this kind; undefined: no theme imported */
  match?: ThemeMatch | null;
  /** Per-part status for composite values (a type style) */
  matchParts?: Array<{ label: string; match: ThemeMatch | null }>;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h5 className="m-0 mb-2 text-sm font-semibold text-gray-800">{children}</h5>
);

/** The right-hand (or, in a narrow panel, inline) panel every tab opens for the selected value */
export const TokenDetailPanel: React.FC<{ detail: TokenDetail; themeActive: boolean; onClose: () => void }> = ({
  detail,
  themeActive,
  onClose,
}) => {
  const nameGroups = detail.names.reduce<Record<string, DetailName[]>>((groups, name) => {
    (groups[name.kind] ||= []).push(name);
    return groups;
  }, {});

  return (
    <section
      aria-label={`Details of ${detail.title}`}
      className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 w-full"
    >
      <div className="absolute top-2 right-2">
        <IconButton label="Close details" size={24} onClick={onClose}>
          <IconX />
        </IconButton>
      </div>

      <div className="flex items-center gap-3 mb-3 pr-6">
        <div className="shrink-0">{detail.preview}</div>
        <div className="min-w-0">
          <h4 className="m-0 text-base font-medium text-gray-900 break-words">{detail.title}</h4>
          {detail.subtitle && <div className="text-sm font-mono text-gray-600 break-all">{detail.subtitle}</div>}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <SectionTitle>{detail.formatsTitle ?? "Values"}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-1">
          {detail.formats.map((format) => (
            <CopyField key={format.label} {...format} />
          ))}
        </div>
        {detail.extra && <div className="mt-2 text-xs text-gray-600">{detail.extra}</div>}
      </div>

      {themeActive && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <SectionTitle>Theme</SectionTitle>
          {detail.matchParts ? (
            <div className="flex flex-col gap-1.5">
              {detail.matchParts.map((part) => (
                <MatchLine key={part.label} label={part.label} match={part.match} />
              ))}
            </div>
          ) : (
            <MatchLine match={detail.match ?? null} />
          )}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 mt-3">
        <SectionTitle>Names</SectionTitle>
        {detail.names.length ? (
          <dl className="m-0 flex flex-col gap-1.5">
            {Object.entries(nameGroups).map(([kind, names]) => (
              <div key={kind} className="flex items-start gap-2">
                <dt className="w-20 shrink-0 pt-0.5 text-xs text-gray-600">{kind}</dt>
                <dd className="m-0 min-w-0 flex flex-wrap gap-1">
                  {names.map((name) => (
                    <CopyChip key={name.text} text={name.text} copyValue={name.copy} />
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="m-0 text-xs text-gray-500">No CSS variable or class names this value. Import a theme to name it.</p>
        )}
      </div>

      {detail.elements.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <NodeList elements={detail.elements} />
        </div>
      )}
    </section>
  );
};
