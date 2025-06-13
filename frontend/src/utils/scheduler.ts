import dayjs from "dayjs";
import { customAlphabet } from "nanoid";
import { Alerts } from "src/app/interfaces/study";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

function generateTaskDates(alerts: Alerts): Date[] {
  if (!alerts.startDateTime) return [];
  const start = new Date(alerts.startDateTime);
  if (alerts.repeat === "never") return [start];

  const interval = alerts.interval ?? 1;
  const dates: Date[] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    switch (alerts.repeat) {
      case "daily":
        d.setDate(start.getDate() + i * interval);
        break;
      case "weekly":
        d.setDate(start.getDate() + i * interval * 7);
        break;
      case "monthly":
        d.setMonth(start.getMonth() + i * interval);
        break;
      case "yearly":
        d.setFullYear(start.getFullYear() + i * interval);
        break;
    }
    dates.push(d);
  }

  return dates;
}

export interface Occurrence {
  id:        string;
  timestamp: number;
  name:      string;
  time:      string;
  datetime:  string;   // local-ISO, no Z
  module:    string;
  condition: string;
}

export function schedule(
  module: { id: string; name: string; condition: string; alerts: Alerts },
): Occurrence[] {
  const rawDates = generateTaskDates(module.alerts);
  const events: Occurrence[] = [];

  for (const origDate of rawDates) {
    const local = new Date(origDate.getTime());

    if (module.alerts.random) {
      local.setMinutes(local.getMinutes() - module.alerts.randomInterval);
      const offset = Math.random() * module.alerts.randomInterval * 2;
      local.setMinutes(local.getMinutes() + offset);
    }

    const dt = dayjs(local);
    events.push({
      id:        nanoid(),
      timestamp: dt.valueOf(),
      name:      module.name,
      time:      dt.format("h:mm A"),
      // **local ISO** — calendar will see the correct YYYY-MM-DD
      datetime:  dt.format("YYYY-MM-DDTHH:mm:ss"),
      module:    module.id,
      condition: module.condition,
    });
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}