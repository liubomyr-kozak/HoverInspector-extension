import React from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { useCopy } from "./copy";

/** A labelled value with a copy button: HEX, rem, the font shorthand… */
export const CopyField: React.FC<{ label: string; value: string; wide?: boolean }> = ({ label, value, wide }) => {
  const { copy, copied } = useCopy();
  const isCopied = copied === value;
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-start gap-1 rounded border border-gray-200 bg-white pl-2 pr-0.5 py-0.5">
        <code className="flex-1 min-w-0 py-0.5 text-[13px] font-mono text-gray-900 whitespace-pre-wrap [overflow-wrap:anywhere]">{value}</code>
        <IconButton
          label={isCopied ? `${label} copied` : `Copy ${label}`}
          size={24}
          onClick={() => copy(value)}
          style={isCopied ? { color: "#15803d" } : undefined}
        >
          {isCopied ? <IconCheck /> : <IconCopy />}
        </IconButton>
      </div>
    </div>
  );
};

/** A copyable name chip: CSS variable, class, theme token */
export const CopyChip: React.FC<{ text: string; copyValue?: string; title?: string }> = ({ text, copyValue, title }) => {
  const { copy, copied } = useCopy();
  const value = copyValue ?? text;
  const isCopied = copied === value;
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      title={title ?? `Copy ${value}`}
      className="inline-flex max-w-full items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-mono text-gray-800 hover:bg-gray-100"
    >
      <span className="min-w-0 truncate">{text}</span>
      {isCopied ? (
        <IconCheck size={12} className="shrink-0 text-green-700" aria-label="Copied" />
      ) : (
        <IconCopy size={12} className="shrink-0 text-gray-500" aria-hidden />
      )}
    </button>
  );
};
