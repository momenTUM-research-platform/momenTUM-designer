// src/renderers/scheduler.ts
import dayjs from "dayjs";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

/**
 * One notification definition coming from study schema.
 */
export interface Alert {
  /** Use calendar dates or enrollment-relative offsets */
  scheduleMode: "absolute" | "relative";

  /** Initial notification date-time for absolute mode (ISO string) */
  startDateTime?: string;

  /** Assumed enrollment date for preview in relative mode (YYYY-MM-DD) */
  expectedEnrollmentDate?: string;

  /** Days after enrollment for first notification in relative mode */
  offsetDays?: number;

  /** Time of day (HH:mm) on offset day for first notification in relative mode */
  offsetTime?: string;

  /** Notification content */
  title: string;
  message: string;
  times?: string[];

  /** Repeat configuration */
  repeat: "never" | "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;

  /** End date for repeats in absolute mode (YYYY-MM-DD) */
  until?: string;

  /** Number of additional repeats after the first in relative mode */
  repeatCount?: number;

  /** Randomization, stickiness, timeout */
  random: boolean;
  randomInterval: number;
  sticky: boolean;
  stickyLabel: string;
  timeout: boolean;
  timeoutAfter: number;
}

/**
 * A single calendar occurrence derived from an Alert.
 */
export interface Occurrence {
  id: string;
  timestamp: number;
  name: string;
  time: string;   // e.g. "9:00 AM"
  datetime: string; // local ISO, no trailing "Z"
  module: string;
  condition: string;
  randomOffset?: string;  // e.g. "±60 min"
}

/**
 * Generate base dates either by absolute calendar or relative offsets.
 */
function generateBaseDates(alert: Alert): Date[] {
  if (alert.scheduleMode === "relative") {
    // calculate enrollment-based schedule
    const enroll = alert.expectedEnrollmentDate
      ? dayjs(alert.expectedEnrollmentDate, "YYYY-MM-DD")
      : dayjs();
    const offsetDays = alert.offsetDays ?? 0;
    const [h, m] = (alert.offsetTime ?? "00:00").split(":").map(Number);
    const first = enroll
      .add(offsetDays, "day")
      .hour(h)
      .minute(m)
      .second(0)
      .millisecond(0);

    if (alert.repeat === "never") {
      return [first.toDate()];
    }

    const interval = alert.interval ?? 1;
    const repeatCount = alert.repeatCount ?? 0;
    const total = repeatCount + 1;
    const dates: Date[] = [];
    for (let i = 0; i < total; i++) {
      let d = first.clone();
      switch (alert.repeat) {
        case "daily":   d = d.add(i * interval, "day");    break;
        case "weekly":  d = d.add(i * interval, "week");   break;
        case "monthly": d = d.add(i * interval, "month");  break;
        case "yearly":  d = d.add(i * interval, "year");   break;
      }
      dates.push(d.toDate());
    }
    return dates;
  }

  // absolute scheduling
  if (!alert.startDateTime) return [];
  const start = new Date(alert.startDateTime);
  if (alert.repeat === "never") {
    return [start];
  }

  const interval = alert.interval ?? 1;
  const untilDate = alert.until
    ? dayjs(alert.until, "YYYY-MM-DD").endOf("day").toDate()
    : null;

  const dates: Date[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    switch (alert.repeat) {
      case "daily":   d.setDate(start.getDate() + i * interval);      break;
      case "weekly":  d.setDate(start.getDate() + i * interval * 7);  break;
      case "monthly": d.setMonth(start.getMonth() + i * interval);     break;
      case "yearly":  d.setFullYear(start.getFullYear() + i * interval);break;
    }
    if (untilDate && d > untilDate) break;
    dates.push(d);
  }
  return dates;
}

/**
 * For each base date, include any extra times of day.
 */
export function computeAllDates(alert: Alert): Date[] {
  const base = generateBaseDates(alert);
  const out: Date[] = [];
  base.forEach((b) => {
    out.push(new Date(b));
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
 * Build the full schedule of Occurrences for a module.
 */
export function schedule(
  module: { id: string; name: string; condition: string; alerts: Alert }
): Occurrence[] {
  const rawDates = computeAllDates(module.alerts);
  const events = rawDates.map((orig) => {
    const dt = dayjs(orig);
    return {
      id: nanoid(),
      timestamp: dt.valueOf(),
      name: module.name,
      time: dt.format("h:mm A"),
      datetime: dt.format("YYYY-MM-DDTHH:mm:ss"),
      module: module.id,
      condition: module.condition,
      randomOffset: module.alerts.random
        ? `±${module.alerts.randomInterval} min`
        : undefined,
    };
  });

  return events.sort((a, b) => a.timestamp - b.timestamp);
}