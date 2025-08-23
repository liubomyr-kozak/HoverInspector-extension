import React from "react";
import type { CSSDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/utils/cssParser.ts";

interface NodeWithClassRules {
  classRules?: Record<string, Record<string, any>>;
}

interface ClassViewProps {
  diff: CSSDiff | null;
  search: string;
  leftNode: NodeWithClassRules | null;
  rightNode: NodeWithClassRules | null;
}

const HighlightText = ({ text, query, context = "neutral" }: { text: string; query: string; context?: "neutral" | "added" | "removed" }) => {
  if (!query?.trim()) return <>{text}</>;
  const q = query.toLowerCase();
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q ? (
          <mark
            key={i}
            className={
              context === "neutral"
                ? "rounded px-0.5 bg-amber-200/70 text-amber-950 ring-1 ring-amber-300/60"
                : "rounded px-0.5 bg-white/70 text-current ring-1 ring-amber-300/60"
            }
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

const copyText = async (text: string) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  } catch {}
};

type PropDiffLine =
  | { kind: "unchanged"; prop: string; value: string }
  | { kind: "added"; prop: string; value: string }
  | { kind: "removed"; prop: string; value: string }
  | { kind: "changed_old"; prop: string; value: string }
  | { kind: "changed_new"; prop: string; value: string };

const diffProps = (oldProps: Record<string, any> | undefined, newProps: Record<string, any> | undefined) => {
  const oldP = oldProps || {};
  const newP = newProps || {};
  const allKeys = new Set([...Object.keys(oldP), ...Object.keys(newP)]);
  const lines: PropDiffLine[] = [];

  const unchanged: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  allKeys.forEach((k) => {
    const o = oldP[k];
    const n = newP[k];
    if (o === undefined && n !== undefined) added.push(k);
    else if (o !== undefined && n === undefined) removed.push(k);
    else if (o === n) unchanged.push(k);
    else changed.push(k);
  });

  // Order: unchanged, removed, changed (old then new), added
  unchanged.sort().forEach((k) => lines.push({ kind: "unchanged", prop: k, value: String((newP as any)[k]) }));
  removed.sort().forEach((k) => lines.push({ kind: "removed", prop: k, value: String((oldP as any)[k]) }));
  changed.sort().forEach((k) => {
    lines.push({ kind: "changed_old", prop: k, value: String((oldP as any)[k]) });
    lines.push({ kind: "changed_new", prop: k, value: String((newP as any)[k]) });
  });
  added.sort().forEach((k) => lines.push({ kind: "added", prop: k, value: String((newP as any)[k]) }));

  return lines;
};

const toCssBlockString = (className: string, props: Record<string, any> | undefined) => {
  const p = props || {};
  const body = Object.entries(p)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `.${className} {\n${body}\n}`;
};

export const ClassView: React.FC<ClassViewProps> = ({ search, leftNode, rightNode }) => {
  const leftClasses = leftNode?.classRules || {};
  const rightClasses = rightNode?.classRules || {};

  const classNames = Array.from(new Set([...Object.keys(leftClasses), ...Object.keys(rightClasses)])).sort();

  if (classNames.length === 0) {
    return <div className="p-4 text-gray-500 text-center max-h-96 overflow-auto">No classes found</div>;
  }

  const filteredNames = classNames.filter((name) => {
    if (!search.trim()) return true;
    const lines = diffProps(leftClasses[name], rightClasses[name]).map((l) => `${l.prop}: ${l.value};`);
    const haystack = [`.${name}`, ...lines].join("\n").toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  if (filteredNames.length === 0) {
    return <div className="p-4 text-gray-500 text-center max-h-96 overflow-auto">No matching classes found</div>;
  }

  const visibleCssString = filteredNames
    .map((name) => toCssBlockString(name, rightClasses[name] ?? leftClasses[name]))
    .join("\n\n");

  return (
    <div className="p-4">
      <div className="rounded-xl border border-gray-200 bg-white/60 shadow-sm hover:shadow-md transition-shadow">
        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between sticky top-[-15px] z-10 backdrop-blur-sm bg-white/60 text-sm font-semibold text-gray-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-gray-400" />
            <span>Classes ({filteredNames.length})</span>
          </div>
          {search?.trim() && <span className="text-xs text-gray-500">filtered by “{search}”</span>}
          <button
            className="ml-3 text-gray-400 hover:text-gray-600"
            title="Copy visible CSS"
            onClick={() => copyText(visibleCssString)}
          >
            📋
          </button>
        </div>
        <pre className="p-3 text-xs font-mono">
          <code>
            {filteredNames.map((name) => {
              const oldProps = leftClasses[name];
              const newProps = rightClasses[name];
              const lines = diffProps(oldProps, newProps);
              return (
                <React.Fragment key={name}>
                  <div>
                    .<HighlightText text={name} query={search} context="neutral" /> {"{"}
                  </div>
                  {lines.map((ln, idx) => {
                    const prefix = ln.kind === 'added' ? '+ ' : ln.kind === 'removed' ? '- ' : ln.kind.startsWith('changed') ? (ln.kind === 'changed_old' ? '- ' : '+ ') : '  ';
                    const colorClass = ln.kind === 'added' ? 'text-green-700' : ln.kind === 'removed' ? 'text-red-700' : ln.kind === 'changed_old' ? 'text-red-700' : ln.kind === 'changed_new' ? 'text-green-700' : 'text-gray-800';
                    const bgClass = ln.kind === 'added' ? 'bg-green-50' : ln.kind === 'removed' ? 'bg-red-50' : ln.kind === 'changed_old' ? 'bg-red-50' : ln.kind === 'changed_new' ? 'bg-green-50' : '';
                    return (
                      <div key={idx} className={`${bgClass} ${colorClass}`}>
                        <span className="select-none">{prefix}</span>
                        <span>
                          <HighlightText
                            text={`  ${ln.prop}: ${ln.value};`}
                            query={search}
                            context={ln.kind === 'added' || ln.kind === 'changed_new' ? 'added' : ln.kind === 'removed' || ln.kind === 'changed_old' ? 'removed' : 'neutral'}
                          />
                        </span>
                      </div>
                    );
                  })}
                  <div>{"}"}</div>
                  <div>&nbsp;</div>
                </React.Fragment>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};
