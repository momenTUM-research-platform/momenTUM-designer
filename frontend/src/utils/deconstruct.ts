import toast from 'react-hot-toast';
import {
  isProperties,
  isModule,
  isSection,
  isQuestion,
  isParams,
} from "../types/guards";

export function deconstructStudy(study: Study): Atoms {
  let atoms: Atoms = new Map();

  function extractChildren(
    object: Study | Question | Module | Params | Section,
    parent: string | null
  ) {
    // @ts-ignore
    const normalizeID = (id) => {
      try {
        if (id === undefined) {
          throw new Error("The 'id' parameter is undefined.");
        }

        let n = id.toLowerCase();
        n = n.replace(/[^a-z0-9_]/g, "");
        return n;
      } catch (error: any) {
        toast.error(error.message);
      }
    };

    if (isModule(object)) {
      const atom: Atom<Module> = {
        parent: parent,
        subNodes: [normalizeID(object.params.id!)],
        type: "module",
        childType: null,
        content: { ...object, _type: "module", params: object.params },
        title:
          object.name.length > 32
            ? object.name.slice(0, 32) + "..."
            : object.name,
        actions: ["delete"],
        hidden: false,
      };

      atoms.set(normalizeID(object.id), atom);
      if (object.params) {
        extractChildren(object.params, normalizeID(object.id));
      }
    } else if (isParams(object)) {
      if (object.type == "survey") {
        const atom: Atom<Params> = {
          parent: parent,
          subNodes: object.sections!.map((s) => normalizeID(s.id)),
          type: "section",
          childType: "question",
          content: { ...object, _type: "params", type: "survey", sections: [] },
          title: "New Survey",
          actions: ["create", "delete"],
          hidden: false,
        };

        atoms.set(normalizeID(object.id!), atom);
        if (object.sections) {
          object.sections.forEach((child) =>
            extractChildren(child, normalizeID(object.id!))
          );
        }
      } else {
        const atom: Atom<Params> = {
          parent: parent,
          subNodes: null,
          type: "section",
          childType: "question",
          content: { ...object, _type: "params", type: "pvt" },
          title: "New PVT",
          actions: [],
          hidden: false,
        };

        atoms.set(normalizeID(object.id!), atom);
      }
    } else if (isSection(object)) {
      const atom: Atom<Section> = {
        parent: parent,
        subNodes: object.questions.map((s) => normalizeID(s.id)),
        type: "section",
        childType: "question",
        content: { ...object, _type: "section", questions: [] },
        title:
          object.name.length > 32
            ? object.name.slice(0, 32) + "..."
            : object.name,

        actions: ["create", "delete", "earlier", "later"],
        hidden: false,
      };

      atoms.set(normalizeID(object.id), atom);
      object.questions.forEach((child) =>
        extractChildren(child, normalizeID(object.id))
      );
    } else if (isQuestion(object)) {
      const atom: Atom<Question> = {
        parent: parent,
        subNodes: null,
        type: "question",
        childType: null,
        content: { ...object, _type: "question" },
        title:
          object.text.length > 32
            ? object.text.slice(0, 60) + "..."
            : object.text,
        actions: ["delete", "earlier", "later"],
        hidden: false,
      };

      atoms.set(normalizeID(object.id), atom);
    } else {
      // Must be the top level study object
      const study: Atom<Study> = {
        parent: null,
        subNodes: [
          "properties",
          ...object.modules.map((m) => normalizeID(m.id)),
        ],
        type: "study",
        childType: "module",
        title: object.properties.study_name,
        actions: ["create"],
        hidden: false,
        content: {
          properties: {} as Properties, // Left empty until construction
          modules: [],
          _type: "study",
        },
      };
      const properties: Atom<Properties> = {
        parent: "study",
        subNodes: null,
        type: "properties",
        childType: null,
        content: {
          ...object.properties,
          _type: "properties",
          study_id: normalizeID(object.properties.study_id),
        },
        title: "Properties",
        actions: [],
        hidden: false,
      };
      atoms.set("study", study);
      atoms.set("properties", properties);
      object.modules.forEach((child) =>
        extractChildren(child, normalizeID("study"))
      );
    }
  }

  extractChildren(study, null);
  return atoms;
}
