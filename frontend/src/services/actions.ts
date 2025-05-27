// actions.ts
import toast from "react-hot-toast";
import { API_URL } from "../App";
import { useStore } from "../State";
import { constructStudy } from "../utils/construct";
import { deconstructStudy } from "../utils/deconstruct";
import fetch from "cross-fetch";
import {
  validateEachNode,
  validateStudyFromObj,
  validateStudy,
} from "./validations";
import { generateOdmXml } from "../utils/odmExport"; // <-- ODM import

export function validate() {
  const { atoms } = useStore.getState();
  const study = constructStudy(atoms);
  const { true_conditions, qIds, mIds } = getStudyCQMFromAtom(study);
  try {
    validateEachNode(atoms, true_conditions, qIds, mIds);
    if (validateStudy(study)) {
      toast.success("Study is valid");
    }
  } catch (err: any) {
    console.error("[validate] Validation error:", err);
    return false;
  }
}

export function save() {
  const { atoms } = useStore.getState();
  const study = constructStudy(atoms);
  // Log the study object for debugging
  console.debug("[save] Constructed study JSON:", study);
  const data = JSON.stringify(study, null, 2);
  const uri = "data:application/json;charset=utf-8," + encodeURIComponent(data);
  const link = document.createElement("a");
  link.href = uri;
  link.download = "study.json";
  link.click();
}

export function load() {
  const { setAtoms } = useStore.getState();
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    // @ts-ignore
    const file = e.target.files![0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(reader.result as string);
        console.debug("[load] Loaded study data:", data);
        const deconstructed = deconstructStudy(data);
        const rebuild = constructStudy(deconstructed);
        if (validateStudyFromObj(rebuild)) {
          setAtoms(deconstructed);
          toast.success("Loaded Successfully!");
        } else {
          toast.error("Error while loading study!");
        }
      } catch (error) {
        console.error("[load] Parsing error:", error);
        toast.error("Invalid file format.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

export async function upload(study: any): Promise<{ permalink: string; message: string }> {
  const postURL = `${API_URL}/studies`;
  const payload = JSON.stringify(study);

  console.debug("[upload] POST", postURL);
  console.debug("[upload] payload:", payload);

  const res = await fetch(postURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  // 1) Try to parse JSON
  let body: any;
  try {
    body = await res.json();
  } catch {
    // if there's no valid JSON at all
    throw `Upload succeeded but returned invalid JSON`;
  }

  // 2) HTTP‐level error?
  if (!res.ok) {
    const msg =
      typeof body.message === "string" ? body.message : JSON.stringify(body);
    throw `Study upload failed (${res.status}): ${msg}`;
  }

  // 3) Did we get a permalink?
  if (typeof body.permalink !== "string") {
    throw `Upload succeeded but no permalink returned: ${JSON.stringify(body)}`;
  }

  console.debug("[upload] got permalink:", body.permalink);
  return { permalink: body.permalink, message: body.message };
}

export async function download(study_id: string): Promise<any> {
  const uri = API_URL + "/studies/" + study_id;
  console.debug("[download] Fetching study from:", uri);
  try {
    const response = await fetch(uri);
    if (response.ok) {
      return await response.json();
    } else {
      throw "Status: " + response.statusText + " " + (await response.text());
    }
  } catch (error) {
    console.error("[download] Error:", error);
    throw "Error: " + error;
  }
}

export async function createRedcapProject(username: string, study: any) {
  const uri = API_URL + "/redcap/project/" + username;
  console.debug("[createRedcapProject] URL:", uri);
  console.debug("[createRedcapProject] Study payload:", study);
  try {
    const response = await fetch(uri, {
      method: "POST",
      body: JSON.stringify(study),
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      return await response.text();
    } else {
      throw "Status: " + response.statusText + " " + (await response.text());
    }
  } catch (error) {
    console.error("[createRedcapProject] Error:", error);
    throw "Error: " + error;
  }
}

export function getStudyCQMFromAtom(study: any): {
  true_conditions: string[];
  qIds: any[];
  mIds: any[];
} {
  const { atoms } = useStore.getState();
  const qIds: any[] = [{ id: "none", text: "None" }];
  const mIds: any[] = [];
  for (const [key, value] of atoms.entries()) {
    if (value.content?._type === "question") {
      qIds.push({ id: key, text: value.content.text });
    }
    if (value.content?._type === "module") {
      mIds.push({ id: key, text: value.content.name });
    }
  }
  let true_conditions: string[] = ["*"];
  try {
    const c = study?.properties?.conditions;
    if (c) {
      true_conditions.push(...c);
    }
  } catch (err: any) {
    console.error("[getStudyCQMFromAtom] Conditions error:", err);
    toast.error("Conditions error: " + err.message);
    return { true_conditions: [], qIds: qIds, mIds: mIds };
  }
  return { true_conditions, qIds, mIds };
}

// --- Updated REDCap manual export (frontend-only) ---
export function saveRedcapFileForManual(): void {
  const { atoms } = useStore.getState();
  const study = constructStudy(atoms);
  console.debug("[saveRedcapFileForManual] Constructed study object:", study);

  try {
    const odmXml = generateOdmXml(study);
    console.debug("[saveRedcapFileForManual] Generated ODM XML:", odmXml);
    const blob = new Blob([odmXml], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // Use study.properties.study_id to name the file, if defined
    link.download = study.properties.study_id
      ? `${study.properties.study_id}.xml`
      : "study.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("ODM file downloaded!");
  } catch (error) {
    console.error("[saveRedcapFileForManual] Failed to generate ODM:", error);
    toast.error("Failed to generate ODM file.");
  }
}