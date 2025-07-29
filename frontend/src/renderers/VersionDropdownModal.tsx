import { Dialog } from "@headlessui/react";
import { useState } from "react";

export function VersionDropdownModal({ close, versions }: { close: () => void; versions: any[] }) {
  const [selectedId, setSelectedId] = useState(versions[0]?._id || "");

  return (
    <div className="p-6">
      <Dialog.Title className="text-lg font-semibold text-gray-900">
        Previous Versions
      </Dialog.Title>

      <p className="mt-2 text-sm text-gray-500">
        Select a version to view details.
      </p>

      <select
        className="mt-4 w-full border rounded-md px-3 py-2 text-sm"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {versions.map((v, idx) => (
          <option key={idx} value={v._id}>
            v{v.version ?? "?"} – {v.properties?.title ?? "Untitled"} – Last modified:{" "}
            {new Date(v.timestamp).toLocaleDateString()}
          </option>
        ))}
      </select>

      <div className="mt-6">
        <button
          onClick={close}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
