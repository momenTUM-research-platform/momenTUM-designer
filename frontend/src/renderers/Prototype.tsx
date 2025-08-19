import React, { useMemo, useState, useRef } from "react";
import ProgressBar from "./ProgressBar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8200/api/v2";

type Study = {
  _id?: string;
  version?: number;
  properties: { study_id: string; study_name: string };
  modules: any[];
};

type Question = {
  id: string;
  text: string;
  required: boolean;
  type?: string;
  _type?: string;
  question_type?: string;
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

type Section = { questions: Question[]; name: string };

const Prototype: React.FC = () => {
  const [studyIdInput, setStudyIdInput] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [study, setStudy] = useState<Study | null>(null);
  const [moduleIdx, setModuleIdx] = useState(0);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>({});
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const currentModule = useMemo(() => {
    if (!study) return null;
    return study.modules[moduleIdx] ?? null;
  }, [study, moduleIdx]);

  const sections: Section[] = useMemo(() => {
    if (!currentModule) return [];
    const params = currentModule?.params || {};
    const secs = params?.sections || [];
    return secs;
  }, [currentModule]);

  const currentSection = sections[sectionIdx] || null;
  const qType = (q: Question) => (q.question_type ?? q.type ?? "").toLowerCase();

  const isVisible = (q: Question): boolean => {
    if (!q.hide_id || q.hide_id === "none") return true;
    const allModAnswers = answers[currentModule?.id || ""] || {};
    const refVal = allModAnswers[q.hide_id];
    const shouldHide = q.hide_if
      ? refVal === q.hide_value
      : refVal !== undefined && refVal !== q.hide_value;
    return !shouldHide;
  };

  const updateAnswer = (qid: string, value: any) => {
    if (!currentModule) return;
    const mid = currentModule.id;
    setAnswers((prev) => ({
      ...prev,
      [mid]: { ...(prev[mid] || {}), [qid]: value },
    }));
  };

  const validateRequired = (): { ok: boolean; missing: string[] } => {
    if (!currentSection || !currentModule) return { ok: true, missing: [] };
    const mid = currentModule.id;
    const modAnswers = answers[mid] || {};
    const missing: string[] = [];

    (currentSection.questions || [])
      .filter(isVisible)
      .forEach((q) => {
        if (q.required) {
          const val = modAnswers[q.id];
          if (val === undefined || val === "" || val === null) {
            missing.push(q.text || q.id);
          }
        }
      });

    return { ok: missing.length === 0, missing };
  };

  const loadStudy = async () => {
    setMsg("");
    setStudy(null);
    setModuleIdx(0);
    setSectionIdx(0);
    setAnswers({});

    if (!studyIdInput) {
      setMsg("Please enter a study ID.");
      return;
    }

    // cancel any in-flight fetch
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    try {
      // IMPORTANT: this endpoint returns the LATEST version per your backend
      const res = await fetch(`${API_URL}/studies/${encodeURIComponent(studyIdInput)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Study not found (${res.status})`);
      const data: Study = await res.json();
      setStudy(data);
      setMsg("");
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        setMsg("Study not found.");
      }
    } finally {
      setLoading(false);
    }
  };

  const nextSection = () => {
    const { ok, missing } = validateRequired();
    if (!ok) {
      setMsg(`Please answer required fields: ${missing.join(", ")}`);
      return;
    }
    setMsg("");
    if (sectionIdx < sections.length - 1) {
      setSectionIdx((i) => i + 1);
    } else {
      setMsg("You’re at the end of this module. Submit to record your responses.");
    }
  };

  const prevSection = () => {
    setMsg("");
    setSectionIdx((i) => Math.max(0, i - 1));
  };

  const goNextModule = () => {
    setMsg("");
    setSectionIdx(0);
    if (!study) return;
    if (moduleIdx < study.modules.length - 1) {
      setModuleIdx((i) => i + 1);
    }
  };

  const submitModule = async () => {
    if (!study || !currentModule) return;
    const { ok, missing } = validateRequired();
    if (!ok) {
      setMsg(`Please answer required fields: ${missing.join(", ")}`);
      return;
    }

    const mid = currentModule.id;
    const payload = {
      study_id: study.properties.study_id,
      participant_id: participantId || "anon",
      event_type: "ResponseSubmitted",
      version: study.version ?? 1, // LATEST version from backend doc
      timestamp: new Date().toISOString(),
      payload: {
        module_id: mid,
        module_name: currentModule.name,
        responses: answers[mid] || {},
      },
    };

    try {
      const res = await fetch(`${API_URL}/progress/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submission failed");
      setMsg(`Responses for "${currentModule.name}" submitted.`);
    } catch (e) {
      console.error(e);
      setMsg("Failed to submit responses.");
    }
  };

  // ----- UI progress calculations -----
  const totalModules = study?.modules?.length ?? 0;
  const moduleProgressPct =
    totalModules > 0 ? Math.round(((moduleIdx) / totalModules) * 100) : 0;

  const sectionProgressPct =
    sections.length > 0 ? Math.round(((sectionIdx + 1) / sections.length) * 100) : 0;

  const renderQuestion = (q: Question) => {
    const type = qType(q);
    const mid = currentModule?.id || "";
    const val = (answers[mid] || {})[q.id] ?? "";

    if (type === "text") {
      if (q.subtype === "numeric") {
        return (
          <input
            type="number"
            className="border p-2 w-full"
            value={val}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
          />
        );
      }
      if (q.subtype === "long") {
        return (
          <textarea
            className="border p-2 w-full"
            rows={3}
            value={val}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
          />
        );
      }
      return (
        <input
          type="text"
          className="border p-2 w-full"
          value={val}
          onChange={(e) => updateAnswer(q.id, e.target.value)}
        />
      );
    }

    if (type === "yesno") {
      return (
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={q.id}
              checked={val === "Yes" || val === true}
              onChange={() => updateAnswer(q.id, "Yes")}
            />
            Yes
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={q.id}
              checked={val === "No" || val === false}
              onChange={() => updateAnswer(q.id, "No")}
            />
            No
          </label>
        </div>
      );
    }

    if (type === "multi") {
      const opts = q.options || [];
      return (
        <div className="flex flex-col gap-2">
          {opts.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name={q.id}
                checked={val === opt}
                onChange={() => updateAnswer(q.id, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    if (type === "slider") {
      const min = q.min ?? 0;
      const max = q.max ?? 10;
      const v = val === "" ? Math.floor((min + max) / 2) : Number(val);
      return (
        <div>
          <input
            type="range"
            min={min}
            max={max}
            value={Number.isNaN(v) ? 0 : v}
            onChange={(e) => updateAnswer(q.id, Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-600 mt-1">
            {q.hint_left ?? min} — <strong>{Number.isNaN(v) ? 0 : v}</strong> — {q.hint_right ?? max}
          </div>
        </div>
      );
    }

    if (type === "datetime") {
      if (q.subtype === "time") {
        return (
          <input
            type="time"
            className="border p-2 w-full"
            value={val}
            onChange={(e) => updateAnswer(q.id, e.target.value)}
          />
        );
      }
      return (
        <input
          type="date"
          className="border p-2 w-full"
          value={val}
          onChange={(e) => updateAnswer(q.id, e.target.value)}
        />
      );
    }

    // fallback text
    return (
      <input
        type="text"
        className="border p-2 w-full"
        value={val}
        onChange={(e) => updateAnswer(q.id, e.target.value)}
      />
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Prototype Participant View</h1>

      <div className="flex gap-3 mb-4">
        <input
          className="border p-2 flex-1"
          placeholder="Study ID"
          value={studyIdInput}
          onChange={(e) => setStudyIdInput(e.target.value)}
        />
        <input
          className="border p-2 flex-1"
          placeholder="Participant ID"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        />
        <button
          onClick={loadStudy}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Loading..." : "Load Study"}
        </button>
      </div>

      {study && (
        <>
          <div className="mb-4">
            <div className="text-sm text-gray-600">
              Study: <strong>{study.properties.study_name}</strong> • Version:{" "}
              <strong>{study.version ?? 1}</strong>
            </div>

            {/* Progress bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <ProgressBar
                value={moduleProgressPct}
                title="Overall Progress (Modules)"
                label={`${moduleIdx}/${totalModules} modules`}
              />
              <ProgressBar
                value={sectionProgressPct}
                title="Current Module Progress (Sections)"
                label={
                  sections.length > 0
                    ? `${sectionIdx + 1}/${sections.length} sections`
                    : "No sections"
                }
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm">Module</span>
              <select
                className="border p-2"
                value={moduleIdx}
                onChange={(e) => {
                  setModuleIdx(Number(e.target.value));
                  setSectionIdx(0);
                  setMsg("");
                }}
              >
                {study.modules.map((m, i) => (
                  <option key={m.id ?? i} value={i}>
                    {m.name ?? m.id ?? `Module ${i + 1}`}
                  </option>
                ))}
              </select>

              {sections.length > 0 && (
                <>
                  <span className="text-sm">Section</span>
                  <select
                    className="border p-2"
                    value={sectionIdx}
                    onChange={(e) => setSectionIdx(Number(e.target.value))}
                  >
                    {sections.map((s, i) => (
                      <option key={i} value={i}>
                        {s.name ?? `Section ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {currentSection ? (
            <div className="border rounded p-4 bg-white shadow">
              <h3 className="text-lg font-semibold mb-4">
                {currentModule?.name} — {currentSection.name}
              </h3>

              <div className="space-y-4">
                {(currentSection.questions || [])
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
                  <>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded"
                      onClick={submitModule}
                    >
                      Submit Module
                    </button>
                    {moduleIdx < (study.modules.length - 1) && (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        onClick={goNextModule}
                      >
                        Next Module
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p>No sections found for this module.</p>
          )}
        </>
      )}

      {msg && <p className="mt-4 text-blue-700">{msg}</p>}
    </div>
  );
};

export default Prototype;
