import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Subscription } from "rxjs";
import { Button, Input } from "antd";
import { IconCrosshair, IconEye, IconArrowUp, IconX } from "@tabler/icons-react";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { StepType } from "../../types";
import { generateXPaths } from "../../utils/xpathUtils";
import { resolvePickedElement } from "../../utils/pickTarget";
import {
  ElementToolbar,
  ErrorText,
  FallbackRow,
  Fallbacks,
  Field,
  FieldHead,
  Hint,
  Label,
  MonoArea,
  Optional,
  PickingBanner,
  SmallIconButton,
  StatusChip,
  Tone,
} from "./StepForm.styled";

type Match =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "missing" }
  | { status: "found"; count: number; viaFallback: boolean };

const countMatches = (xpath: string): number | null => {
  try {
    return document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
  } catch {
    return null;
  }
};

/** Whether the step's element is on this page: by its XPath, or else by one of its fallbacks */
const findMatch = (xpath: string, alternatives: string[]): Match => {
  if (!xpath.trim()) return { status: "empty" };
  const count = countMatches(xpath);
  if (count === null) return { status: "invalid" };
  if (count > 0) return { status: "found", count, viaFallback: false };
  if (alternatives.some((alternative) => (countMatches(alternative) ?? 0) > 0)) {
    return { status: "found", count: 1, viaFallback: true };
  }
  return { status: "missing" };
};

const sameMatch = (a: Match, b: Match) => JSON.stringify(a) === JSON.stringify(b);

// Short text for the chip (the panel can be 320 px wide), the whole story in its tooltip
const describeMatch = (match: Match): { tone: Tone; text: string; title: string } => {
  switch (match.status) {
    case "found":
      if (match.viaFallback) {
        return { tone: "warning", text: "Found by a fallback", title: "This XPath finds nothing here; a fallback XPath finds the element" };
      }
      return match.count === 1
        ? { tone: "success", text: "Found", title: "The XPath finds exactly one element on this page" }
        : { tone: "warning", text: `${match.count} matches`, title: `The XPath finds ${match.count} elements; playback uses the first` };
    case "missing":
      return { tone: "muted", text: "Not on this page", title: "Nothing on this page matches; it may appear on another page or later" };
    case "invalid":
      return { tone: "danger", text: "Invalid XPath", title: "The browser cannot read this XPath" };
    default:
      return { tone: "muted", text: "No element", title: "Pick the element on the page, or paste its XPath" };
  }
};

// The page changes under the form (menus open, lists load): check the element again now and then
const RECHECK_INTERVAL = 2000;

interface ElementFieldProps {
  stepType: StepType;
  xpath: string;
  alternatives: string[];
  required: boolean;
  label?: string;
  hint?: string;
  error?: string;
  onXPathChange: (xpath: string) => void;
  /** A new element was picked, or a fallback was made the main XPath */
  onElementChange: (xpath: string, alternatives: string[]) => void;
}

/**
 * The element a step acts on: its XPath, whether it is on this page, "Pick on page" to choose it with the
 * mouse (replacing the step's element, never adding a step) and the fallback XPaths playback tries in turn.
 */
export const ElementField: React.FC<ElementFieldProps> = ({
  stepType,
  xpath,
  alternatives,
  required,
  label = "Element",
  hint,
  error,
  onXPathChange,
  onElementChange,
}) => {
  const highlightManager = useHighlightOverlay();
  const inputId = useId();
  const [picking, setPicking] = useState(false);
  const subscriptionRef = useRef<Subscription | null>(null);
  const [match, setMatch] = useState<Match>(() => findMatch(xpath, alternatives));

  // Compared by content: the parent may pass a new array with the same XPaths on every render
  const alternativesKey = alternatives.join("\n");
  useEffect(() => {
    const check = () => setMatch((previous) => {
      const next = findMatch(xpath, alternatives);
      return sameMatch(previous, next) ? previous : next;
    });
    check();
    const timer = window.setInterval(check, RECHECK_INTERVAL);
    return () => window.clearInterval(timer);
  }, [xpath, alternativesKey]);

  const stopPicking = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setPicking(false);
  }, []);

  // Leaving the form (collapsing the card, deleting the step) ends the picking
  useEffect(() => stopPicking, [stopPicking]);

  const startPicking = () => {
    stopPicking();
    setPicking(true);
    subscriptionRef.current = highlightManager.streamSelectionMode().subscribe({
      next: (event) => {
        if (event.type === "selected" && event.element) {
          const target = resolvePickedElement(event.element, stepType);
          const { primaryXPath, alternativeXpaths } = generateXPaths(target);
          if (primaryXPath) onElementChange(primaryXPath, alternativeXpaths);
        }
        if (event.type === "stopped") {
          subscriptionRef.current = null;
          setPicking(false);
        }
      },
      error: () => setPicking(false),
    });
  };

  const cancelPicking = () => {
    highlightManager.stopSelectionMode();
    stopPicking();
  };

  const showOnPage = () => {
    const visible = [xpath, ...alternatives].find((candidate) => (countMatches(candidate) ?? 0) > 0);
    if (visible) highlightManager.startHighlight(visible, "hover");
  };

  const useFallback = (index: number) => {
    const fallback = alternatives[index];
    const rest = alternatives.filter((_, i) => i !== index);
    onElementChange(fallback, xpath ? [xpath, ...rest] : rest);
  };

  const status = describeMatch(match);
  const canShow = match.status === "found";

  return (
    <Field>
      <FieldHead>
        <Label htmlFor={inputId}>
          {label}
          {!required && <Optional>optional</Optional>}
        </Label>
      </FieldHead>

      <MonoArea>
        <Input.TextArea
          id={inputId}
          value={xpath}
          onChange={(e) => onXPathChange(e.target.value)}
          placeholder="Pick it on the page, or paste an XPath"
          autoSize={{ minRows: 1, maxRows: 4 }}
          status={error ? "error" : undefined}
          spellCheck={false}
        />
      </MonoArea>

      {picking ? (
        <PickingBanner role="status">
          <span>Click the element on the page. Esc cancels.</span>
          <SmallIconButton label="Cancel picking" size={24} onClick={cancelPicking}>
            <IconX />
          </SmallIconButton>
        </PickingBanner>
      ) : (
        <ElementToolbar>
          <StatusChip $tone={status.tone} title={status.title}>
            {status.text}
          </StatusChip>
          <SmallIconButton label="Show on page" size={24} onClick={showOnPage} disabled={!canShow}>
            <IconEye />
          </SmallIconButton>
          <Button size="small" icon={<IconCrosshair size={14} />} onClick={startPicking}>
            {xpath ? "Pick again" : "Pick on page"}
          </Button>
        </ElementToolbar>
      )}

      {error && <ErrorText role="alert">{error}</ErrorText>}
      {hint && <Hint>{hint}</Hint>}

      {alternatives.length > 0 && (
        <Fallbacks>
          <summary>
            {alternatives.length} fallback XPath{alternatives.length === 1 ? "" : "s"}, tried in turn if this one fails
          </summary>
          <ol>
            {alternatives.map((alternative, index) => (
              <FallbackRow key={alternative}>
                <code title={alternative}>{alternative}</code>
                <SmallIconButton label="Use as the main XPath" size={22} onClick={() => useFallback(index)}>
                  <IconArrowUp />
                </SmallIconButton>
              </FallbackRow>
            ))}
          </ol>
        </Fallbacks>
      )}
    </Field>
  );
};
