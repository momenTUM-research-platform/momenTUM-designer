// src/utils/useTimeline.ts
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useStore } from "../State";
import { schedule, Occurrence } from "./scheduler";

// ———————————————————————————————————————————
// Local types matching JSON schema:

/** one notification definition */
interface Alert {
  /** Scheduling mode: absolute or relative */
  scheduleMode: "absolute" | "relative";

  /** Initial datetime for absolute mode (ISO string) */
  startDateTime?: string;

  /** Expected enrollment date for preview in relative mode (YYYY-MM-DD) */
  expectedEnrollmentDate?: string;

  /** Days after enrollment for first notification in relative mode */
  offsetDays?: number;

  /** Time of day for offset day in relative mode (HH:mm) */
  offsetTime?: string;

  title: string;
  message: string;
  times?: string[];

  repeat: "never" | "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  until?: string;
  repeatCount?: number;

  random: boolean;
  randomInterval: number;
  sticky: boolean;
  stickyLabel: string;
  timeout: boolean;
  timeoutAfter: number;
}

/** “module” shape as stored in the atom map */
interface Module {
  id: string;
  name: string;
  condition: string;
  alerts: Alert[];
}

// ———————————————————————————————————————————

export interface Day {
  date: string;         // “YYYY-MM-DD”
  events: Occurrence[]; 
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function useTimeline(): [
  dayjs.Dayjs,
  React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
  Day[]
] {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const atoms = useStore(s => s.atoms);
  const [visibleDays, setVisibleDays] = useState<Day[]>([]);

  useEffect(() => {
    // collect all module definitions from atom map
    const modulesList: Module[] = Array.from(atoms.values())
      .filter(n => n.type === "module")
      .map(n => n.content as Module);

    // generate occurrences for each module
    const allEvents: Occurrence[] = modulesList.flatMap(m => schedule(m));

    // build a 6x7 calendar grid for the current month
    const startOfMonth = currentDate.startOf("month");
    const mondayOffset = (startOfMonth.day() + 6) % 7;
    const gridStart = startOfMonth.subtract(mondayOffset, "day");

    const grid: Day[] = Array.from({ length: 42 }).map((_, i) => {
      const d = gridStart.add(i, "day");
      const dateKey = d.format("YYYY-MM-DD");
      return {
        date: dateKey,
        events: allEvents.filter(e => e.datetime.startsWith(dateKey)),
        isCurrentMonth: d.month() === currentDate.month(),
        isToday: d.isSame(dayjs(), "day"),
        isSelected: false,
      };
    });

    setVisibleDays(grid);
  }, [currentDate, atoms]);

  return [currentDate, setCurrentDate, visibleDays];
}