import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useStore }             from "../State";
import { schedule, Occurrence } from "./scheduler";

// ———————————————————————————————————————————
// Local types matching JSON schema:

/** one notification definition */
interface Alert {
  title:           string;
  message:         string;
  startDateTime:   string;                           // ISO datetime
  interval?:       number;                           // default=1
  repeat:          "never"|"daily"|"weekly"|"monthly"|"yearly";
  until?:          string;                           // YYYY-MM-DD
  random:          boolean;
  randomInterval:  number;
  sticky:          boolean;
  stickyLabel:     string;
  timeout:         boolean;
  timeoutAfter:    number;
}

/** “module” shape as stored in the atom map */
interface Module {
  id:           string;
  name:         string;
  condition:    string;
  alerts:       Alert[];
  // don’t need graph/unlock_after for scheduling
}

// ———————————————————————————————————————————

export interface Day {
  date:           string;    // “YYYY-MM-DD”
  events:         Occurrence[];
  isCurrentMonth: boolean;
  isToday:        boolean;
  isSelected:     boolean;
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
    // collect all modules from the atom map:
    const modulesList: Module[] = Array.from(atoms.values())
      .filter(n => n.type === "module")
      .map(n => n.content as Module);

    // generate all occurrences:
    const allEvents: Occurrence[] = modulesList.flatMap(m => schedule(m));

    // build a 6×7 grid for the current month, starting on the Monday before the 1st:
    const startOfMonth = currentDate.startOf("month");
    const mondayOffset = (startOfMonth.day() + 6) % 7;
    const gridStart    = startOfMonth.subtract(mondayOffset, "day");

    const grid: Day[] = Array.from({ length: 42 }).map((_, i) => {
      const d       = gridStart.add(i, "day");
      const dateKey = d.format("YYYY-MM-DD");
      return {
        date:           dateKey,
        events:         allEvents.filter(e => e.datetime.startsWith(dateKey)),
        isCurrentMonth: d.month() === currentDate.month(),
        isToday:        d.isSame(dayjs(), "day"),
        isSelected:     false,
      };
    });

    setVisibleDays(grid);
  }, [currentDate, atoms]);

  return [currentDate, setCurrentDate, visibleDays];
}