import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useStore } from "../State";
import { schedule, Occurence } from "./scheduler";
import type { Module, Properties } from "src/app/interfaces/study";

export interface Day {
  date: string;            // "YYYY-MM-DD"
  events: Occurence[];     // all events scheduled for that date
  isCurrentMonth: boolean; // grid cell shading
  isToday: boolean;        // highlight today
  isSelected: boolean;     
}

export function useTimeline(): [
  dayjs.Dayjs,
  React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
  Day[]
] {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const atoms = useStore((s) => s.atoms);
  const [visibleDays, setVisibleDays] = useState<Day[]>([]);

  useEffect(() => {
    // 1) grab study props + modules out of the atoms map
    const propsNode = atoms.get("properties");
    if (!propsNode) return;
    const properties = propsNode.content as Properties;

    const modulesList: Module[] = Array.from(atoms.values())
      .filter((n) => n.type === "module")
      .map((n) => n.content as Module);

    // 2) generate all occurrences using shared scheduler
    const allEvents: Occurence[] = modulesList.flatMap((m) =>
      schedule(m, properties)
    );

    // 3) build a 6×7 month grid starting on the Monday before the 1st
    const startOfMonth = currentDate.startOf("month");
    // dayjs().day(): Sunday=0…Saturday=6; we want Monday=0…Sunday=6
    const mondayOffset = (startOfMonth.day() + 6) % 7;
    const gridStart = startOfMonth.subtract(mondayOffset, "day");

    // 4) fill 42 days, slot each event by matching ISO date prefix
    const grid: Day[] = Array.from({ length: 42 }).map((_, i) => {
      const d = gridStart.add(i, "day");
      const dateKey = d.format("YYYY-MM-DD");
      return {
        date: dateKey,
        events: allEvents.filter((e) =>
          e.datetime.startsWith(dateKey)
        ),
        isCurrentMonth: d.month() === currentDate.month(),
        isToday: d.isSame(dayjs(), "day"),
        isSelected: false,
      };
    });

    setVisibleDays(grid);
  }, [currentDate, atoms]);

  return [currentDate, setCurrentDate, visibleDays];
}