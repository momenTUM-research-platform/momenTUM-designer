import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { getAllStudyVersions, getSpecificStudyVersion } from "../services/actions";
import { toast } from "react-hot-toast";
import React from "react";

export default function StudyVersionSelector({ isOpen, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAllStudyVersions()
        .then((res) => {
          if (res.versions?.length > 0) {
            setVersions(res.versions);
          } else {
            toast.error("No versions available.");
            onClose();
          }
        })
        .catch(() => {
          toast.error("Could not fetch versions.");
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleLoad = async (version) => {
    try {
      await getSpecificStudyVersion(version);
      toast.success(`Loaded version ${version}`);
      onClose();
    } catch (err) {
      toast.error("Error loading version");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Select a Study Version
          </Dialog.Title>

          {loading ? (
            <p>Loading versions...</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {versions.map((v) => (
                <li
                  key={v.version ?? v}
                  className="flex items-center justify-between border p-2 rounded hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium">Version {v.version ?? v}</p>
                  </div>
                  <button
                    onClick={() => handleLoad(v.version ?? v)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Load
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
