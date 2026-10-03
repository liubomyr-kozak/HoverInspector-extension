import React, { useState } from "react";
import { IconCheck, IconCopy, IconEye } from "@tabler/icons-react";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { useCopy } from "./copy";

const classesOf = (element: Element) => Array.from(element.classList).filter((c) => !/[:[\]/]/.test(c));

/** Short label: `button#save.btn` */
export const elementLabel = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  if (element.id) return `${tag}#${element.id}`;
  const classes = classesOf(element).slice(0, 2);
  return classes.length ? `${tag}.${classes.join(".")}` : tag;
};

const escapeIdent = (value: string) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value);

/** A CSS selector that finds this element: its id, or a path of tags with :nth-of-type from the nearest id */
export const cssPath = (element: Element): string => {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    if (node.id) {
      parts.unshift(`#${escapeIdent(node.id)}`);
      break;
    }
    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    let part = tag;
    const firstClass = classesOf(node)[0];
    if (firstClass) part += `.${escapeIdent(firstClass)}`;
    if (parent) {
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      if (sameTag.length > 1) part = `${tag}:nth-of-type(${sameTag.indexOf(node) + 1})${firstClass ? `.${escapeIdent(firstClass)}` : ""}`;
    }
    parts.unshift(part);
    if (tag === "body") break;
    node = parent;
  }
  return parts.join(" > ");
};

const VISIBLE = 5;

/** "Found in N elements": click a node to scroll to and highlight it, copy its selector */
export const NodeList: React.FC<{ elements: Element[]; total?: number }> = ({ elements, total }) => {
  const [expanded, setExpanded] = useState(false);
  const highlight = useHighlightOverlay();
  const { copy, copied } = useCopy();
  const count = total ?? elements.length;
  if (!elements.length) return null;
  const shown = expanded ? elements : elements.slice(0, VISIBLE);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <IconEye size={16} className="text-blue-600" aria-hidden />
        <span className="text-sm font-medium text-gray-700">
          Found in {count} {count === 1 ? "element" : "elements"}
        </span>
        {elements.length > VISIBLE && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="ml-auto text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            {expanded ? "Show less" : `Show all +${elements.length - VISIBLE}`}
          </button>
        )}
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-1">
        {shown.map((element, index) => {
          const alive = element.isConnected;
          const selector = alive ? cssPath(element) : "";
          const label = elementLabel(element);
          return (
            <li key={index} className="flex items-center gap-1 min-w-0">
              <button
                type="button"
                disabled={!alive}
                onClick={() => highlight.startHighlight(highlight.generateXPath(element))}
                title={alive ? `Scroll to and highlight ${selector}` : "No longer on the page: rescan"}
                className="flex-1 min-w-0 flex items-center gap-1.5 text-left text-xs font-mono px-2 py-1 rounded-md border border-blue-200 bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconEye size={12} className="shrink-0 text-blue-600" aria-hidden />
                <span className="shrink-0 max-w-[60%] truncate">{label}</span>
                {(element.textContent || "").trim() && (
                  <span className="min-w-0 truncate font-sans text-gray-500">{(element.textContent || "").trim().slice(0, 40)}</span>
                )}
              </button>
              {alive && (
                <button
                  type="button"
                  onClick={() => copy(selector)}
                  aria-label={`Copy selector ${selector}`}
                  title={`Copy selector: ${selector}`}
                  className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  {copied === selector ? <IconCheck size={14} className="text-green-700" /> : <IconCopy size={14} />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {count > elements.length && (
        <p className="text-[11px] text-gray-500 mt-1 mb-0">The first {elements.length} are listed.</p>
      )}
    </div>
  );
};
