// src/renderers/scheduler.ts
import dayjs from "dayjs";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

/**
 * One notification definition coming from study schema.
 */
export interface Alert {
  title:          string;
  message:        string;
  startDateTime:  string;                          // ISO date-time
  times?:         string[];                        // extra “HH:mm” times-of-day
  interval?:      number;                          // default: 1
  repeat:         "never" | "daily" | "weekly" | "monthly" | "yearly";
  until?:         string;                          // YYYY-MM-DD
  random:         boolean;
  randomInterval: number;                          // in minutes
  sticky:         boolean;
  stickyLabel:    string;
  timeout:        boolean;
  timeoutAfter:   number;
}

/**
 * A single calendar occurrence derived from an Alert.
 */
export interface Occurrence {
  id:           string;
  timestamp:    number;
  name:         string;
  time:         string;   // e.g. "9:00 AM"
  datetime:     string;   // local ISO, no trailing "Z"
  module:       string;
  condition:    string;

  /** how much jitter will be applied at fire time */
  randomOffset?: string;  // e.g. "±60 min"
}

/** 
 * Step 1: build up to 30 “base” Dates from startDateTime + repeat…until
 */
function generateBaseDates(alert: Alert): Date[] {
  if (!alert.startDateTime) return [];
  const start = new Date(alert.startDateTime);

  if (alert.repeat === "never") {
    return [start];
  }

  const interval  = alert.interval ?? 1;
  const untilDate = alert.until
    ? dayjs(alert.until, "YYYY-MM-DD").endOf("day").toDate()
    : null;

  const dates: Date[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    switch (alert.repeat) {
      case "daily":   d.setDate(  start.getDate() +  i * interval); break;
      case "weekly":  d.setDate(  start.getDate() +  i * interval * 7); break;
      case "monthly": d.setMonth( start.getMonth() + i * interval); break;
      case "yearly":  d.setFullYear(start.getFullYear() + i * interval); break;
    }
    if (untilDate && d > untilDate) break;
    dates.push(d);
  }
  return dates;
}

/** 
 * Step 2: for each base date, sprinkle in any extra times of day
 */
export function computeAllDates(alert: Alert): Date[] {
  const base = generateBaseDates(alert);
  const out: Date[] = [];
  base.forEach((b) => {
    out.push(new Date(b)); // “primary” time from startDateTime
    (alert.times ?? []).forEach((t) => {
      const [h, m] = t.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const d = new Date(b);
        d.setHours(h, m, 0, 0);
        out.push(d);
      }
    });
  });
  return out;
}

/**
 * Build the full schedule of Occurrences for *one* module,
 * given its single alerts object.
 */
export function schedule(
  module: { id: string; name: string; condition: string; alerts: Alert }
): Occurrence[] {
  const rawDates = computeAllDates(module.alerts);

  const events = rawDates.map(orig => {
    const dt = dayjs(orig);
    return {
      id:           nanoid(),
      timestamp:    dt.valueOf(),            // still the *nominal* time
      name:         module.name,
      time:         dt.format("h:mm A"),
      datetime:     dt.format("YYYY-MM-DDTHH:mm:ss"),
      module:       module.id,
      condition:    module.condition,

      // new: the calendar can render “±N min” next to each slot
      randomOffset: module.alerts.random
        ? `±${module.alerts.randomInterval} min`
        : undefined,
    } as Occurrence;
  });

  // chronologically
  return events.sort((a, b) => a.timestamp - b.timestamp);
}