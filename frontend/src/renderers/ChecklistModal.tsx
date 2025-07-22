import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { useStore } from "../State";
import { constructStudy } from "../utils/construct";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import { computeAllDates, Alert as SchedulerAlert } from "../utils/scheduler";

type Row = Record<string, string>;

export function ChecklistModal() {
  const { modal, setModal, atoms } = useStore();
  if (modal !== "checklist") return null;

  const study = constructStudy(atoms);
  const studyId = study.properties.study_id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const singularMap: Record<string, string> = {
      daily: "day",
      weekly: "week",
      monthly: "month",
      yearly: "year",
    };

    const rr: Row[] = study.modules.map((mod) => {
      const a = mod.alerts as SchedulerAlert & {
        scheduleMode: "absolute" | "relative";
        offsetDays?: number;
        offsetTime?: string;
        expectedEnrollmentDate?: string;
        repeatCount?: number;
      };
      const p = mod.params as any;

      // ─── Compute first date of this module ───────────────────
      let first: dayjs.Dayjs;
      if (a.scheduleMode === "absolute") {
        first = dayjs(a.startDateTime);
      } else {
        const enroll = dayjs(a.expectedEnrollmentDate);
        first = enroll.add(a.offsetDays ?? 0, "day");
        const [h, m] = (a.offsetTime ?? "00:00").split(":").map(Number);
        first = first.hour(h).minute(m);
      }
      const dateKey = first.format("YYYY-MM-DD");

      // ─── Build times-of-day string ───────────────────────────
      let timesOfDay: string;
      if (a.scheduleMode === "absolute") {
        const dayZeroDates = computeAllDates(a).filter((d) =>
          dayjs(d).format("YYYY-MM-DD") === dateKey
        );
        timesOfDay = Array.from(
          new Set(dayZeroDates.map((d) => dayjs(d).format("h:mm A")))
        ).join(", ");
      } else {
        // relative: base time + extras
        const base = dayjs(a.offsetTime ?? "00:00", "HH:mm").format("h:mm A");
        const extras = (a.times ?? []).map((t) =>
          dayjs(t, "HH:mm").format("h:mm A")
        );
        timesOfDay = Array.from(new Set([base, ...extras])).join(", ");
      }

      // ─── Human‐readable schedule description ────────────────
      let scheduleDesc: string;
      if (a.scheduleMode === "absolute") {
        if (a.repeat === "never") {
          scheduleDesc = `On ${dateKey}`;
        } else {
          const n = a.interval ?? 1;
          const unit = singularMap[a.repeat] || a.repeat;
          const freq = n === 1 ? `every ${unit}` : `every ${n} ${unit}s`;
          scheduleDesc = `Starting ${dateKey}, ${freq}`;
          if (a.until) scheduleDesc += ` until ${a.until}`;
        }
      } else {
        if (a.repeat === "never") {
          scheduleDesc = `${a.offsetDays} day(s) after enrollment at ${a.offsetTime}`;
        } else {
          const n = a.interval ?? 1;
          const unit = singularMap[a.repeat] || a.repeat;
          const freq = n === 1 ? `every ${unit}` : `every ${n} ${unit}s`;
          scheduleDesc = `Starting ${a.offsetDays} day(s) after enrollment at ${a.offsetTime}, ${freq}`;
          if (a.repeatCount != null) {
            scheduleDesc += `, +${a.repeatCount} repeats`;
          }
        }
      }

      return {
        ModuleID:            mod.id,
        Name:                mod.name,
        Condition:           mod.condition,
        ScheduleMode:        a.scheduleMode,
        ExpectedEnrollment:  a.expectedEnrollmentDate || "",
        OffsetDays:          String(a.offsetDays ?? ""),
        OffsetTime:          a.offsetTime || "",
        Repeat:              a.repeat,
        RepeatCount:         a.scheduleMode === "relative"
                                ? String(a.repeatCount ?? "")
                                : "",
        Interval:            String(a.interval ?? ""),
        Until:               a.until ?? "",
        Type:                p.type || "",
        SubmitText:          p.submit_text || "",
        ShuffleSections:     String(p.shuffle ?? ""),
        MinWaiting:          p.min_waiting != null
                               ? String(p.min_waiting)
                               : "",
        MaxWaiting:          p.max_waiting != null
                               ? String(p.max_waiting)
                               : "",
        Sticky:              String(a.sticky),
        StickyLabel:         a.stickyLabel,
        RandomInterval:      String(a.randomInterval),
        Timeout:             String(a.timeout),
        TimeoutAfter:        String(a.timeoutAfter),
        Schedule:            scheduleDesc,
        Times:               timesOfDay,
      };
    });

    setRows(rr);
    setLoading(false);
  }, [atoms, study.modules]);

  const downloadCsv = () => {
    const csv = Papa.unparse(rows);
    saveAs(
      new Blob([csv], { type: "text/csv" }),
      `checklist-${studyId}.csv`
    );
  };

  return (
    <Dialog
      open
      onClose={() => setModal(null)}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-h-[90vh] flex flex-col px-6 sm:max-w-3xl lg:max-w-7xl">
        <button
          onClick={() => setModal(null)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <Dialog.Title className="px-6 pt-6 text-lg font-semibold">
          Study Checklist
        </Dialog.Title>
        <div className="px-6 pb-4 flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-sm text-gray-500">No modules found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(rows[0]).map((h) => (
                      <th
                        key={h}
                        className="px-2 py-1 text-left font-medium text-gray-700"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {Object.values(r).map((c, j) => (
                        <td
                          key={j}
                          className="px-2 py-1 text-gray-800"
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t flex justify-end">
          <button
            onClick={downloadCsv}
            disabled={loading || rows.length === 0}
            className="text-main hover:underline disabled:text-gray-400"
          >
            Download CSV
          </button>
        </div>
      </div>
    </Dialog>
  );
}