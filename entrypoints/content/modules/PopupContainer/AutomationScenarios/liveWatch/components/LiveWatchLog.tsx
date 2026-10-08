import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Button } from "antd";
import { selectScenarios } from "@entrypoints/content/store/automation/automation.slice";
import { ScenarioMap } from "../../types";
import { restoreAllSuggestions, restorePattern, useLiveWatchSettings, useStoredWatchEvents } from "../store";
import { describeEvent, findPatterns, isPatternSaved } from "../utils/patterns";
import { DetectedPattern, PatternStatus, WatchEvent } from "../types";

/** How many of the newest actions the log lists */
const LOG_ROWS = 100;

const STATUS_TEXT: Record<PatternStatus, string> = {
  [PatternStatus.SUGGESTED]: "Will be suggested",
  [PatternStatus.HIDDEN]: "Hidden",
  [PatternStatus.SAVED]: "Saved as a scenario",
};

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const pageOf = (event: WatchEvent): string => {
  let host = event.origin;
  try {
    host = new URL(event.origin).host;
  } catch {
    // Keep the raw origin
  }
  return `${host}${event.path ?? ""}`;
};

/**
 * What live watching saw and what it made of it: the repeated sequences on this site (with why one is not
 * suggested) and the newest actions on every site. Lets the user check it works and bring back a
 * suggestion they hid with "Don't suggest again".
 */
export const LiveWatchLog: React.FC = () => {
  const events = useStoredWatchEvents();
  const { dismissedPatterns, mutedFields } = useLiveWatchSettings();
  const scenarios = (useSelector(selectScenarios) as ScenarioMap | undefined) || {};
  const origin = window.location.origin;

  const patterns = useMemo(() => {
    const siteEvents = events.filter((event) => event.origin === origin);
    const statusOf = (id: string, saved: boolean) =>
      dismissedPatterns.includes(id) ? PatternStatus.HIDDEN : saved ? PatternStatus.SAVED : PatternStatus.SUGGESTED;
    const isExcluded = (pattern: DetectedPattern) =>
      dismissedPatterns.includes(pattern.id) || isPatternSaved(pattern, scenarios);
    // What the watcher offers, then the patterns it leaves out
    const suggested = findPatterns(siteEvents, { exclude: isExcluded });
    const excluded = findPatterns(siteEvents, { limit: 10 }).filter(isExcluded);
    return [...suggested, ...excluded].map((pattern) => ({
      pattern,
      status: statusOf(pattern.id, isPatternSaved(pattern, scenarios)),
    }));
  }, [events, origin, dismissedPatterns, scenarios]);

  const recent = useMemo(() => events.slice(-LOG_ROWS).reverse(), [events]);
  const hiddenCount = dismissedPatterns.length + mutedFields.length;

  return (
    <div className="mt-2 flex flex-col gap-3 border-0 border-t border-solid border-gray-200 pt-2 text-xs">
      <section aria-label="Repeated on this site">
        <h4 className="m-0 mb-1 text-xs font-medium text-gray-800">Repeated on this site</h4>
        {patterns.length === 0 ? (
          <p className="m-0 text-gray-600">
            Nothing yet. Steps count as repeated when you do the same sequence twice (three times for two steps)
            without a 30-minute break.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {patterns.map(({ pattern, status }) => (
              <li key={pattern.id} className="rounded border border-solid border-gray-200 bg-white px-2 py-1">
                <div className="text-gray-800">{pattern.events.map(describeEvent).join(", ")}</div>
                <div className="mt-0.5 flex items-center gap-2 text-gray-600">
                  <span>
                    {pattern.occurrences} times · {STATUS_TEXT[status]}
                  </span>
                  {status === PatternStatus.HIDDEN && (
                    <Button type="link" size="small" className="h-auto px-0 text-xs" onClick={() => restorePattern(pattern.id)}>
                      Show again
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {hiddenCount > 0 && (
          <div className="mt-1 flex items-center gap-2 text-gray-600">
            <span>{hiddenCount} suggestions hidden with "Don't suggest again"</span>
            <Button type="link" size="small" className="h-auto px-0 text-xs" onClick={restoreAllSuggestions}>
              Show all again
            </Button>
          </div>
        )}
      </section>

      <section aria-label="Recent actions">
        <h4 className="m-0 mb-1 text-xs font-medium text-gray-800">Recent actions</h4>
        <p className="m-0 mb-1 text-gray-600">Only tabs where Hover Inspector is on are watched.</p>
        {recent.length === 0 ? (
          <p className="m-0 text-gray-600">No actions seen yet.</p>
        ) : (
          <ol className="m-0 flex max-h-64 list-none flex-col overflow-y-auto p-0">
            {recent.map((event) => (
              <li key={event.id} className="flex gap-2 border-0 border-b border-solid border-gray-100 py-1 last:border-b-0">
                <time className="flex-none tabular-nums text-gray-500" dateTime={new Date(event.time).toISOString()}>
                  {timeFormat.format(event.time)}
                </time>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-gray-800">{describeEvent(event)}</span>
                  <span className="block truncate text-gray-500">{pageOf(event)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
