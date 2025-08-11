import React, { useState } from "react";
import ModuleRunner from "../renderers/ModuleRunner"; // this will render sections/questions

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8200/api/v2";

type Study = {
  version: number;
  properties: { study_id: string; study_name: string };
  modules: any[];
};

const Prototype: React.FC = () => {
  const [studyId, setStudyId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [study, setStudy] = useState<Study | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [message, setMessage] = useState("");

  const loadStudy = async () => {
    try {
      setMessage("");
      const res = await fetch(`${API_URL}/studies/${studyId}`);
      if (!res.ok) throw new Error("Study not found");

      const data = await res.json();
      setStudy(data);
      setCurrentModuleIndex(0);
    } catch (err) {
      console.error(err);
      setMessage("Study not found.");
    }
  };

  const handleModuleComplete = () => {
    if (study && currentModuleIndex < study.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    } else {
      setMessage("All modules completed.");
    }
  };

  if (!study) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Prototype Participant View</h1>

        <div className="mb-4">
          <label>Study ID:</label>
          <input
            className="border p-2 ml-2"
            value={studyId}
            onChange={(e) => setStudyId(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label>Participant ID:</label>
          <input
            className="border p-2 ml-2"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
          />
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 mb-6"
          onClick={loadStudy}
        >
          Load Study
        </button>

        {message && <p className="mt-4 text-red-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">
        {study.properties.study_name}
      </h1>
      <p className="mb-4 text-gray-600">
        Module {currentModuleIndex + 1} of {study.modules.length}
      </p>

      <ModuleRunner
        module={study.modules[currentModuleIndex]}
        studyId={studyId}
        participantId={participantId}
        version={study.version}
        onComplete={handleModuleComplete}
      />

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
};

export default Prototype;
