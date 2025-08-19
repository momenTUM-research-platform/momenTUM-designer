import React, { useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8200/api/v2";

type Question = {
  id: string;
  text: string;
  required: boolean;
  type?: string;            
  question_type?: string;  
  _type?: string;
  subtype?: string;       
  radio?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  hint_left?: string;
  hint_right?: string;
  hide_id?: string | null;
  hide_value?: string | boolean | null;
  hide_if?: boolean | null;
};

type Section = { name?: string; questions: Question[] };

type Props = {
  module: any;            
  studyId: string;
  participantId: string;
  version: number;
  onComplete: () => void; 
};

const ModuleRunner: React.FC<Props> = ({
  module,
  studyId,
  participantId,
  version,
  onComplete,
}) => {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState<string>("");

  const sectionProgressPct =
  sections.length > 0 ? Math.round(((sectionIdx + 1) / sections.length) * 100) : 0;

// in the JSX, above the section content:
<ProgressBar
  value={sectionProgressPct}
  title="Section Progress"
  label={
    sections.length > 0
      ? `${sectionIdx + 1}/${sections.length} sections`
      : "No sections"
  }
/>

  const sections: Section[] = useMemo(() => {
    const params = module?.params || {};
    return params?.sections || [];
  }, [module]);

  const currentSection = sections[sectionIdx] || null;

  const qType = (q: Question) => (q.question_type ?? q.type ?? "").toLowerCase();

  const isVisible = (q: Question): boolean => {
    if (!q.hide_id || q.hide_id === "none") return true;
    const refVal = answers[q.hide_id];
    const shouldHide = q.hide_if ? refVal === q.hide_value : refVal !== undefined && refVal !== q.hide_value;
    return !shouldHide;
  };



  const update = (qid: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const validateRequired = (): { ok: boolean; missing: string[] } => {
    if (!currentSection) return { ok: true, missing: [] };
    const missing: string[] = [];
    (currentSection.questions || []).forEach((q) => {
      if (!isVisible(q)) return;
      if (!q.required) return;
      const val = answers[q.id];
      if (val === undefined || val === "" || val === null) {
        missing.push(q.text || q.id);
      }
    });
    return { ok: missing.length === 0, missing };
  };

  const prevSection = () => {
    setMsg("");
    setSectionIdx((i) => Math.max(0, i - 1));
  };

  const nextSection = () => {
    const { ok, missing } = validateRequired();
    if (!ok) {
      setMsg(`Please answer required: ${missing.join(", ")}`);
      return;
    }
    setMsg("");
    if (sectionIdx < sections.length - 1) {
      setSectionIdx((i) => i + 1);
    } else {
      setMsg("End of module. Submit to record your responses.");
    }
  };

  const submitModule = async () => {
  console.log("Submitting module...");
  console.log("Current section index:", sectionIdx);
  console.log("Answers so far:", answers);

  const { ok, missing } = validateRequired();
  console.log("Validation result:", { ok, missing });

  if (!ok) {
    setMsg(`Please answer required: ${missing.join(", ")}`);
    console.warn("Submission blocked due to missing required answers:", missing);
    return;
  }

  const payload = {
    study_id: studyId,
    participant_id: participantId || "anon",
    event_type: "ResponseSubmitted",
    version: version ?? 1,
    timestamp: new Date().toISOString(),
    payload: {
      module_id: module.id,
      module_name: module.name,
      responses: answers,
    },
  };

  console.log("Payload to submit:", payload);
  console.log("POST URL:", `${API_URL}/progress/event`);

  try {
    const res = await fetch(`${API_URL}/progress/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("Response status:", res.status);
    if (!res.ok) {
      const text = await res.text();
      console.error("Response not OK. Body:", text);
      throw new Error("Submission failed");
    }
    const data = await res.json();
    console.log("Submission successful. Server returned:", data);

    setMsg(`Responses for "${module.name ?? module.id}" submitted.`);
    onComplete();
  } catch (e) {
    console.error("Error submitting module:", e);
    setMsg("Failed to submit responses.");
  }
};

  const renderQuestion = (q: Question) => {
    const t = qType(q);
    const val = answers[q.id] ?? "";

    if (t === "text") {
      if (q.subtype === "numeric") {
        return (
          <input
            type="number"
            className="border p-2 w-full"
            value={val}
            onChange={(e) => update(q.id, e.target.value)}
          />
        );
      }
      if (q.subtype === "long") {
        return (
          <textarea
            className="border p-2 w-full"
            rows={3}
            value={val}
            onChange={(e) => update(q.id, e.target.value)}
          />
        );
      }
      return (
        <input
          type="text"
          className="border p-2 w-full"
          value={val}
          onChange={(e) => update(q.id, e.target.value)}
        />
      );
    }

    if (t === "yesno") {
      return (
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={q.id}
              checked={val === "Yes" || val === true}
              onChange={() => update(q.id, "Yes")}
            />
            Yes
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={q.id}
              checked={val === "No" || val === false}
              onChange={() => update(q.id, "No")}
            />
            No
          </label>
        </div>
      );
    }

    if (t === "multi") {
      const opts = q.options || [];
      return (
        <div className="flex flex-col gap-2">
          {opts.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name={q.id}
                checked={val === opt}
                onChange={() => update(q.id, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    if (t === "slider") {
      const min = q.min ?? 0;
      const max = q.max ?? 10;
      const v = val === "" ? Math.floor((min + max) / 2) : Number(val);
      return (
        <div>
          <input
            type="range"
            min={min}
            max={max}
            value={isNaN(v) ? 0 : v}
            onChange={(e) => update(q.id, Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-600 mt-1">
            {q.hint_left ?? min} — <strong>{isNaN(v) ? 0 : v}</strong> — {q.hint_right ?? max}
          </div>
        </div>
      );
    }

    if (t === "datetime") {
      if (q.subtype === "time") {
        return (
          <input
            type="time"
            className="border p-2 w-full"
            value={val}
            onChange={(e) => update(q.id, e.target.value)}
          />
        );
      }
      return (
        <input
          type="date"
          className="border p-2 w-full"
          value={val}
          onChange={(e) => update(q.id, e.target.value)}
        />
      );
    }

    return (
      <input
        type="text"
        className="border p-2 w-full"
        value={val}
        onChange={(e) => update(q.id, e.target.value)}
      />
    );
  };

  if (!module) return null;

  return (
    <div className="border rounded p-4 bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">{module.name ?? module.id}</h2>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-600">No sections found in this module.</p>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-3">
            Section {sectionIdx + 1} of {sections.length}:{" "}
            <strong>{currentSection?.name ?? `Section ${sectionIdx + 1}`}</strong>
          </div>

          <div className="space-y-4">
            {(currentSection?.questions || [])
              .filter(isVisible)
              .map((q) => (
                <div key={q.id}>
                  <label className="block font-medium mb-1">
                    {q.text} {q.required && <span className="text-red-600">*</span>}
                  </label>
                  {renderQuestion(q)}
                </div>
              ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              className="px-4 py-2 border rounded"
              onClick={prevSection}
              disabled={sectionIdx === 0}
            >
              Back
            </button>

            {sectionIdx < sections.length - 1 ? (
              <button
                className="px-4 py-2 bg-gray-800 text-white rounded"
                onClick={nextSection}
              >
                Next
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={submitModule}
              >
                Submit Module
              </button>
            )}
          </div>
        </>
      )}

      {msg && <p className="mt-4 text-blue-700">{msg}</p>}
    </div>
  );
};

export default ModuleRunner;
