import React, { memo } from "react";
import { IconArrowBackUp, IconExternalLink, IconForms, IconKeyboard, IconPointer, IconRefresh, IconSelector, IconWorld } from "@tabler/icons-react";
import { NavigationKind, WatchEvent, WatchEventKind, WatchLogItem } from "../types";
import { describeEventParts } from "../utils/patterns";
import { Chip, Row, RowIcon, RowMeta, RowNumber, RowText, RowTime } from "./WatchLogPanel.styled";

interface WatchLogRowProps {
  item: WatchLogItem;
  number: number;
  top: number;
  selected: boolean;
  focused: boolean;
  playing: boolean;
  onClick: (event: React.MouseEvent, id: string) => void;
  onHover: (event: WatchEvent | null) => void;
}

const KIND_ICONS: Record<WatchEventKind, React.ComponentType> = {
  [WatchEventKind.CLICK]: IconPointer,
  [WatchEventKind.INPUT]: IconForms,
  [WatchEventKind.SELECT]: IconSelector,
  [WatchEventKind.KEY_PRESS]: IconKeyboard,
  [WatchEventKind.NAVIGATE]: IconWorld,
};

const NAVIGATION_ICONS: Partial<Record<NavigationKind, React.ComponentType>> = {
  [NavigationKind.RELOAD]: IconRefresh,
  [NavigationKind.BACK_FORWARD]: IconArrowBackUp,
};

const NAVIGATION_VERBS: Record<NavigationKind, string> = {
  [NavigationKind.LOAD]: "Open",
  [NavigationKind.RELOAD]: "Reload",
  [NavigationKind.BACK_FORWARD]: "Back / forward to",
  [NavigationKind.SAME_DOCUMENT]: "Go to",
};

const time = (value: number) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

/** The path of a URL, short enough for a row */
const shortUrl = (url: string | undefined) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`.slice(0, 60) || parsed.host;
  } catch {
    return url.slice(0, 60);
  }
};

/** One action of the watch log */
export const WatchLogRow = memo<WatchLogRowProps>(({ item, number, top, selected, focused, playing, onClick, onHover }) => {
  const { event } = item;
  const navigation = event.kind === WatchEventKind.NAVIGATE;
  const Icon = (navigation && event.navigation && NAVIGATION_ICONS[event.navigation]) || KIND_ICONS[event.kind];
  const parts = describeEventParts(event);
  const verb = navigation ? NAVIGATION_VERBS[event.navigation ?? NavigationKind.LOAD] : parts.verb;
  const target = navigation ? event.label || shortUrl(event.url) : parts.target;
  const detail = navigation ? shortUrl(event.url) : event.kind === WatchEventKind.INPUT && event.sensitive ? "hidden" : parts.detail;
  const description = [`${verb} ${target}`, detail, time(event.time), item.opensUrl ? `opens ${item.opensUrl}` : "", item.repeat > 1 ? `${item.repeat} times` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <Row
      id={`hi-watch-row-${item.id}`}
      role="option"
      aria-selected={selected}
      aria-label={description}
      title={description}
      style={{ top }}
      $selected={selected}
      $focused={focused}
      $playing={playing}
      $minor={!!event.minor}
      onMouseDown={(e) => {
        // Shift+click would select the page's text between the rows
        if (e.shiftKey) e.preventDefault();
      }}
      onClick={(e) => onClick(e, item.id)}
      onMouseEnter={() => onHover(event)}
    >
      <RowNumber aria-hidden="true">{number}</RowNumber>
      <RowIcon $navigation={navigation} aria-hidden="true">
        <Icon />
      </RowIcon>
      <RowText>
        {verb} <strong>{target}</strong>
        {detail && <span className="text-gray-500"> · {detail}</span>}
      </RowText>
      <RowMeta aria-hidden="true">
        {item.repeat > 1 && <Chip>×{item.repeat}</Chip>}
        {item.opensUrl && (
          <Chip $tone="muted" title={item.opensUrl}>
            <IconExternalLink size={11} />
            <span className="truncate">{shortUrl(item.opensUrl).split("?")[0].split("/").pop() || "page"}</span>
          </Chip>
        )}
        <RowTime>{time(event.time)}</RowTime>
      </RowMeta>
    </Row>
  );
});

WatchLogRow.displayName = "WatchLogRow";
