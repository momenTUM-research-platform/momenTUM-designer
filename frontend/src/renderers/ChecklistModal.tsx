import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { useStore } from "../State";
import { constructStudy } from "../utils/construct";
import dayjs from "dayjs";

interface Row {
  [key: string]: string;
}

interface Alerts {
  title: string;
  message: string;
  startDateTime: string;
  repeat: "never" | "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  until?: string;
  random: boolean;
  randomInterval: number;
  sticky: boolean;
  stickyLabel: string;
  timeout: boolean;
  timeoutAfter: number;
}

export function ChecklistModal() {
  const { modal, setModal, atoms } = useStore();
  if (modal !== "checklist") return null;

  const study = constructStudy(atoms);
  const studyId = study.properties.study_id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const singularMap: Record<string,string> = {
      daily:   "day",
      weekly:  "week",
      monthly: "month",
      yearly:  "year",
    };
  
    const rr: Row[] = study.modules.map((mod) => {
      const a = (mod as any).alerts as Alerts;
      const p = (mod as any).params as any;
  
      // parse start
      const start = dayjs(a.startDateTime);
      const date  = start.format("YYYY-MM-DD");
      const time  = start.format("h:mm A");
  
      // build Schedule description
      let scheduleDesc: string;
      if (a.repeat === "never") {
        scheduleDesc = `On ${date} at ${time}`;
      } else {
        const n = a.interval ?? 1;
        const unit = singularMap[a.repeat] || a.repeat;
        const freq = n === 1 ? `every ${unit}` : `every ${n} ${unit}s`;
        scheduleDesc = `Starting ${date}, ${freq} at ${time}`;
        if (a.until) scheduleDesc += ` until ${a.until}`;
      }
  
      return {
        ModuleID:        mod.id,
        Name:            mod.name,
        Condition:       mod.condition,
        Type:            p.type           || "",
        SubmitText:      p.submit_text    || "",
        ShuffleSections: String(p.shuffle ?? ""),
        MinWaiting:      p.min_waiting    != null ? String(p.min_waiting)  : "",
        MaxWaiting:      p.max_waiting    != null ? String(p.max_waiting)  : "",
        TimeoutAfter:    a.timeoutAfter   != null ? String(a.timeoutAfter) : "",
        Sticky:          String(a.sticky),
        RandomInterval:  String(a.randomInterval),
        Schedule:        scheduleDesc,
      }
    });
  
    setRows(rr);
    setLoading(false);
  }, [atoms]);

  const downloadCsv = () => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `checklist-${studyId}.csv`);
  };

  return (
    <Dialog
      open
      onClose={() => setModal(null)}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-h-[90vh] flex flex-col px-6 sm:max-w-3xl md:max-w-5xl lg:max-w-7xl xl:max-w-screen-xl">
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
              <table className="min-w-full table-auto border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(rows[0]).map((header) => (
                      <th
                        key={header}
                        className="whitespace-nowrap px-2 py-1 text-left font-medium text-gray-700"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="overflow-y-auto">
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {Object.values(row).map((cell, cidx) => (
                        <td
                          key={cidx}
                          className="whitespace-nowrap px-2 py-1 text-gray-800"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t flex justify-end space-x-4">
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