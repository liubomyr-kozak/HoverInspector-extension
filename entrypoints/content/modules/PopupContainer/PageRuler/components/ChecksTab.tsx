import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Card } from "antd";
import { IconAlertTriangle, IconCircleCheck, IconCircleX, IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useHighlightOverlay } from "@entrypoints/shared/components/HighlightOverlay/HighlightOverlayContext";
import { LoadingState } from "@entrypoints/shared/components/LoadingState";
import { tokens } from "@entrypoints/shared/styles/tokens";
import { runPageChecks } from "../utils/pageChecks";
import { CheckStatus, type PageCheck } from "../types";
import { ExternalLink, Hint } from "../PageRuler.styled";

interface ChecksTabProps {
  width: number;
}

const STATUS_STYLE: Record<CheckStatus, { color: string; label: string; Icon: typeof IconCircleCheck }> = {
  [CheckStatus.Pass]: { color: tokens.color.success, label: "Passed", Icon: IconCircleCheck },
  [CheckStatus.Warn]: { color: tokens.color.warning, label: "Warning", Icon: IconAlertTriangle },
  [CheckStatus.Fail]: { color: tokens.color.danger, label: "Failed", Icon: IconCircleX },
  [CheckStatus.Info]: { color: tokens.color.primary, label: "Note", Icon: IconInfoCircle },
};

const CheckList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const CheckTitle = styled.div`
  font-size: ${tokens.font.size.sm}px;
  font-weight: 600;
  color: ${tokens.color.text};
`;

const Detail = styled.p`
  margin: 2px 0 0;
  font-size: ${tokens.font.size.xs}px;
  line-height: 1.45;
  color: ${tokens.color.textSecondary};
  overflow-wrap: anywhere;
`;

const Summary = styled.p`
  margin: 0;
  flex: 1;
  font-size: ${tokens.font.size.xs}px;
  color: ${tokens.color.textSecondary};
`;

/** Each click scrolls to and flashes the next element of the check */
const useElementCycler = () => {
  const highlight = useHighlightOverlay();
  const [positions, setPositions] = useState<Record<string, number>>({});

  const show = (check: PageCheck) => {
    const alive = (check.elements ?? []).filter((el) => el.isConnected);
    if (!alive.length) {
      toast.info("Those elements are no longer on the page. Run the checks again.");
      return;
    }
    const next = ((positions[check.id] ?? -1) + 1) % alive.length;
    highlight.startHighlight(highlight.generateXPath(alive[next]));
    setPositions((p) => ({ ...p, [check.id]: next }));
  };

  const reset = useCallback(() => setPositions({}), []);

  return { show, position: (id: string) => positions[id], reset };
};

export const ChecksTab: React.FC<ChecksTabProps> = ({ width }) => {
  const [checks, setChecks] = useState<PageCheck[] | null>(null);
  const [checkedWidth, setCheckedWidth] = useState(width);
  const cycler = useElementCycler();
  const { reset } = cycler;

  const timer = useRef(0);

  const run = useCallback(() => {
    setChecks(null);
    reset();
    clearTimeout(timer.current);
    // Let the loading state paint before the scan takes the main thread
    timer.current = window.setTimeout(() => {
      setChecks(runPageChecks(document));
      setCheckedWidth(document.documentElement.clientWidth || window.innerWidth);
    }, 30);
  }, [reset]);

  useEffect(() => {
    run();
    return () => clearTimeout(timer.current);
  }, [run]);

  if (!checks) return <LoadingState label="Checking the page…" />;

  const count = (status: CheckStatus) => checks.filter((c) => c.status === status).length;
  const summary = [
    [count(CheckStatus.Fail), "failed"],
    [count(CheckStatus.Warn), "to review"],
    [count(CheckStatus.Pass), "passed"],
  ]
    .filter(([n]) => n)
    .map(([n, what]) => `${n} ${what}`)
    .join(" · ");

  return (
    <Card size="small">
      <div className="flex items-center gap-2 mb-3">
        <Summary>
          {summary} at {checkedWidth}px
        </Summary>
        <Button size="small" icon={<IconRefresh size={14} />} onClick={run}>
          Run again
        </Button>
      </div>
      {width !== checkedWidth && (
        <Hint className="mb-3">The window was resized since the last run. Run again to check the new width.</Hint>
      )}
      <CheckList>
        {checks.map((check) => {
          const { color, label, Icon } = STATUS_STYLE[check.status];
          const elementCount = check.elements?.length ?? 0;
          const position = cycler.position(check.id);
          return (
            <li key={check.id} className="flex gap-2">
              <Icon size={18} color={color} aria-label={label} role="img" className="shrink-0 mt-px" />
              <div className="flex-1 min-w-0">
                <CheckTitle>{check.title}</CheckTitle>
                <Detail>{check.detail}</Detail>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {check.standard &&
                    (check.source ? (
                      <ExternalLink href={check.source}>{check.standard}</ExternalLink>
                    ) : (
                      <Hint>{check.standard}</Hint>
                    ))}
                  {elementCount > 0 && (
                    <Button size="small" type="link" className="!p-0 !h-auto !text-xs" onClick={() => cycler.show(check)}>
                      {position === undefined ? `Show on page (${elementCount})` : `Next (${position + 1}/${elementCount})`}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </CheckList>
    </Card>
  );
};
