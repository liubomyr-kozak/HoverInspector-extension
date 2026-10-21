import { WatchEvent } from "../types";

export interface WatchLogExport {
  exportedAt: string;
  count: number;
  /** Every stored event, oldest first; typing events carry the text when it is still in memory */
  events: (WatchEvent & { typed?: string })[];
}

/** The whole watch log as a JSON document; text typed in sensitive fields is never in it */
export function watchLogExport(events: WatchEvent[], values: ReadonlyMap<string, string>, now = new Date()): WatchLogExport {
  return {
    exportedAt: now.toISOString(),
    count: events.length,
    events: events.map((event) => {
      const typed = event.sensitive ? undefined : values.get(event.id);
      return typed === undefined ? event : { ...event, typed };
    }),
  };
}

/** File name with the date, so several exports do not overwrite each other */
export const watchLogFileName = (now = new Date()) => `live-watching-${now.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
