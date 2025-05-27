import { isStudy } from "../types/guards";

export function constructStudy(atoms: Atoms): Study {
  const start = JSON.parse(JSON.stringify(atoms.get("study"))) as Atom<Study>;
  let study = appendChildren(start);
  return study;

  function appendChildren<T>(atom: Atom<T>): T {
    let result = atom.content;
    if (isStudy(result)) {
      result.properties = atoms.get("properties")!.content as Properties;
    }

    // After instantiation, recursively append children
    atom.subNodes &&
      atom.subNodes.forEach((id) => {
        let node = atoms.get(id);
        if (node) {
          const copy = JSON.parse(JSON.stringify(node)); // Copy

          if (node.content._type === "properties") {
            // @ts-expect-error
            result.properties = copy.content;
            return;
          }
          const children = appendChildren(copy);
          // @ts-ignore
          const type: AtomVariants = atom.content._type;
          
          switch (type) {
            case "study": {
              //@ts-expect-error
              result.modules.push(children);
              break;
            }
            case "module": {
              // @ts-expect-error
              result.params = children;
              break;
            }
            case "params": {
              // @ts-expect-error
              result.sections.push(children);
              break;
            }
            case "section": {
              // @ts-expect-error
              result.questions.push(children);
              break;
            }
          }
        }
      });
    return result;
  }
}
