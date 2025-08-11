import React from "react";

type Props = {
  module: any;
  studyId: string;
  participantId: string;
  version: number;
  onComplete: () => void;
};

const ModuleRunner: React.FC<Props> = ({ module, onComplete }) => {
  if (!module) return null;
  return (
    <div className="border rounded p-4 bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">{module.name ?? module.id}</h2>
      <p className="text-sm text-gray-600 mb-4">
        (Stub) Sections & questions will render here.
      </p>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={onComplete}
      >
        Complete Module
      </button>
    </div>
  );
};

export default ModuleRunner;
