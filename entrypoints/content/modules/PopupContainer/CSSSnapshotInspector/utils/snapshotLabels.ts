import { CSSSnapshot } from "../types";

/** What a snapshot covers: the whole page, one picked element, or an unsaved capture made for a comparison */
export type SnapshotKind = "page" | "element" | "current";

export const MAX_SNAPSHOT_NAME_LENGTH = 120;

const ELEMENT_PREFIX = "Element: ";

export const getSnapshotKind = (snapshot: Pick<CSSSnapshot, "id">): SnapshotKind => {
  if (snapshot.id.startsWith("element-snapshot-")) return "element";
  if (snapshot.id.startsWith("current-")) return "current";
  return "page";
};

/**
 * The name shown in the list. Element snapshots are stored as "Element: div#id"; the kind is shown with an
 * icon, so the prefix is dropped. Falls back to the page address when there is no title at all.
 */
export const getSnapshotName = (snapshot: Pick<CSSSnapshot, "id" | "title" | "url">): string => {
  const title = (snapshot.title || "").trim();
  if (title.startsWith(ELEMENT_PREFIX) && title.length > ELEMENT_PREFIX.length) {
    return title.slice(ELEMENT_PREFIX.length);
  }
  return title || getSnapshotLocation(snapshot.url) || "Untitled snapshot";
};

/** host + path ("localhost/rich.html"), without protocol, query or a trailing slash */
export const getSnapshotLocation = (url: string | undefined | null): string => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname}${path}` || url;
  } catch {
    return url;
  }
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Short capture time for a list row: "14:05:09" today (seconds tell apart snapshots taken a moment apart),
 * "Oct 3, 14:05" on other days of this year, "Oct 3, 2025" for older ones.
 */
export const formatSnapshotTime = (timestamp: number, now: Date = new Date()): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const time = (withSeconds: boolean) =>
    date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      ...(withSeconds ? { second: "2-digit" } : {}),
    });
  if (sameDay(date, now)) return time(true);
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (date.getFullYear() === now.getFullYear()) return `${day}, ${time(false)}`;
  return `${day}, ${date.getFullYear()}`;
};

/** Full date and time for tooltips */
export const formatSnapshotDateTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** Trims and limits a name typed by the user; returns null when nothing is left */
export const normalizeSnapshotName = (raw: string): string | null => {
  const name = raw.replace(/\s+/g, " ").trim().slice(0, MAX_SNAPSHOT_NAME_LENGTH);
  return name || null;
};
