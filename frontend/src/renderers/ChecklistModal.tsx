import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { useStore } from "../State";
import { constructStudy } from "../utils/construct";
import dayjs from "dayjs";
import { computeAllDates, Alert } from "../utils/scheduler";

interface Row { [key: string]: string; }

export function ChecklistModal() {
  const { modal, setModal, atoms } = useStore();
  if (modal !== "checklist") return null;

  const study = constructStudy(atoms);
  const studyId = study.properties.study_id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const singularMap: Record<string, string> = {
      daily: "day", weekly: "week", monthly: "month", yearly: "year",
    };

    const rr: Row[] = study.modules.map((mod) => {
      const a = (mod as any).alerts as Alert;
      const p = (mod as any).params as any;
      const start = dayjs(a.startDateTime);
      const dateKey = start.format("YYYY-MM-DD");

      // 1️⃣ build all dates, then pick only those on the first date
      const dayZeroDates = computeAllDates(a)
        .filter((d) => dayjs(d).format("YYYY-MM-DD") === dateKey);

      // 2️⃣ format and dedupe times
      const timesOfDay = Array.from(
        new Set(dayZeroDates.map((d) => dayjs(d).format("h:mm A")))
      ).join(", ");

      // 3️⃣ schedule desc without time
      let scheduleDesc: string;
      if (a.repeat === "never") {
        scheduleDesc = `On ${dateKey}`;
      } else {
        const n = a.interval ?? 1;
        const unit = singularMap[a.repeat] || a.repeat;
        const freq = n === 1 ? `every ${unit}` : `every ${n} ${unit}s`;
        scheduleDesc = `Starting ${dateKey}, ${freq}`;
        if (a.until) scheduleDesc += ` until ${a.until}`;
      }

      return {
        ModuleID:      mod.id,
        Name:          mod.name,
        Condition:     mod.condition,
        Type:          p.type        || "",
        SubmitText:    p.submit_text || "",
        ShuffleSections: String(p.shuffle ?? ""),
        MinWaiting:    p.min_waiting != null ? String(p.min_waiting) : "",
        MaxWaiting:    p.max_waiting != null ? String(p.max_waiting) : "",
        TimeoutAfter:  String(a.timeoutAfter),
        Sticky:        String(a.sticky),
        RandomInterval:String(a.randomInterval),
        Schedule:      scheduleDesc,
        Times:         timesOfDay,
      };
    });

    setRows(rr);
    setLoading(false);
    if (!atoms.size) return;
  }, [atoms]);

  const downloadCsv = () => {
    const csv = Papa.unparse(rows);
    saveAs(new Blob([csv], { type: "text/csv" }), `checklist-${studyId}.csv`);
  };

  return (
    <Dialog open onClose={() => setModal(null)}
      className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-h-[90vh] flex flex-col px-6 sm:max-w-3xl lg:max-w-7xl">
        <button onClick={() => setModal(null)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900">
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
                      <th key={h}
                        className="px-2 py-1 text-left font-medium text-gray-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r,i) => (
                    <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                      {Object.values(r).map((c,j)=>(
                        <td key={j} className="px-2 py-1 text-gray-800">
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
            disabled={loading||rows.length===0}
            className="text-main hover:underline disabled:text-gray-400"
          >
            Download CSV
          </button>
        </div>
      </div>
    </Dialog>
  );
}