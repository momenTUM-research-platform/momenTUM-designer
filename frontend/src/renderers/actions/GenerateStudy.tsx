// src/components/GenerateStudy.tsx

import { Dialog } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { classNames } from "../Calendar";
import { useStore } from "../../State";
import { generateStudy } from "../../services/actions";
import { deconstructStudy } from "../../utils/deconstruct";
import { validateStudy } from "../../services/validations";

type GenerateStudyProps = {
  close: () => void;
};

const steps = [
  {
    name: "Enter Instructions",
    description: "Provide a prompt to generate your study",
  },
  {
    name: "Generating",
    description: "Sending your instructions to the server...",
  },
  {
    name: "Verification",
    description: "Quick check that the generated study is valid",
  },
  {
    name: "Finished",
    description: "Your study has been generated successfully",
  },
];

export function GenerateStudy({ close }: GenerateStudyProps) {
  const [step, setStep] = useState(-1);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [study, setStudy] = useState<Study | null>(null);
  const { setAtoms, atoms } = useStore();

  useEffect(() => {
    if (step < 0 || step > 3) return;

    const actions: Array<() => Promise<any>> = [
      // Step 0: Ensure the user has entered some instructions
      () =>
        new Promise<void>((resolve, reject) => {
          if (prompt && prompt.trim().length > 0) {
            resolve();
          } else {
            reject("You need to enter instructions to generate a study.");
          }
        }),

      // Step 1: Call generateStudy(...) with the prompt
      () => generateStudy(prompt!),

      // Step 2: Validate the returned study object
      () =>
        new Promise<void>((resolve, reject) => {
          if (validateStudy(study)) {
            resolve();
          } else {
            reject("The generated study is invalid.");
          }
        }),

      // Step 3: Deconstruct into atoms and store in global state
      () =>
        new Promise<void>((resolve) => {
          const newAtoms = deconstructStudy(study!);
          setAtoms(newAtoms);
          resolve();
        }),
    ];

    actions[step]()
      .then((result) => {
        if (step === 1) {
          // After generating, save the Study object
          setStudy(result as Study);
        }
        setStep(step + 1);
      })
      .catch((err) => {
        toast.error(String(err));
      });
  }, [step]);

  return (
    <div>
      {/* Top Checkmark Icon */}
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
      </div>

      {/* Title */}
      <div className="mt-3 mb-2 text-center sm:mt-5">
        <Dialog open={false} onClose={() => {}}>
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            Generate Study
          </Dialog.Title>
          {/* (You can insert other Dialog content here if needed) */}
        </Dialog>
      </div>

      {step === -1 ? (
        // ──────────── STEP -1: Enter prompt ────────────
        <div>
          <label
            htmlFor="study_prompt"
            className="block text-sm font-medium text-gray-700"
          >
            Instructions
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              name="study_prompt"
              id="study_prompt"
              className="block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="E.g., Create a randomized trial comparing A vs. B"
              aria-describedby="study_prompt"
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center rounded border border-transparent 
                         bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white 
                         shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:ring-offset-2"
            >
              Next
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Provide detailed instructions for generating your study.
          </p>
        </div>
      ) : (
        // ──────────── STEP 0..3: Progress Wizard ────────────
        <nav aria-label="Progress" className="mt-6">
          <ol role="list" className="overflow-hidden">
            {steps.map((content, stepIdx) => (
              <li
                key={content.name}
                className={classNames(
                  stepIdx !== steps.length - 1 ? "pb-10" : "",
                  "relative"
                )}
              >
                {stepIdx < step ? (
                  <>
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 
                                   bg-indigo-600"
                        aria-hidden="true"
                      />
                    )}
                    <a className="group relative flex items-start">
                      <span className="flex h-9 items-center">
                        <span className="relative z-10 flex h-8 w-8 items-center 
                                          justify-center rounded-full bg-indigo-600 
                                          group-hover:bg-indigo-800">
                          <CheckIcon
                            className="h-5 w-5 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium">
                          {content.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {content.description}
                        </span>
                      </span>
                    </a>
                  </>
                ) : step === stepIdx ? (
                  <>
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 
                                   bg-gray-300"
                        aria-hidden="true"
                      />
                    )}
                    <a className="group relative flex items-start">
                      <span
                        className="flex h-9 items-center"
                        aria-hidden="true"
                      >
                        <span className="relative z-10 flex h-8 w-8 items-center 
                                          justify-center rounded-full border-2 
                                          border-indigo-600 bg-white">
                          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-indigo-600">
                          {content.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {content.description}
                        </span>
                      </span>
                    </a>
                  </>
                ) : (
                  <>
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 
                                   bg-gray-300"
                        aria-hidden="true"
                      />
                    )}
                    <a className="group relative flex items-start">
                      <span
                        className="flex h-9 items-center"
                        aria-hidden="true"
                      >
                        <span className="relative z-10 flex h-8 w-8 items-center 
                                          justify-center rounded-full border-2 
                                          border-gray-300 bg-white group-hover:border-gray-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent 
                                      group-hover:bg-gray-300" />
                        </span>
                      </span>
                      <span className="ml-4 flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-gray-500">
                          {content.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {content.description}
                        </span>
                      </span>
                    </a>
                  </>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Bottom Button: “Enter different instructions” until step=3, then “Close” */}
      <div className="mt-5 sm:mt-6">
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(-1)}
            className="inline-flex w-full justify-center rounded-md 
                       border border-transparent bg-indigo-600 px-4 py-2 text-base 
                       font-medium text-white shadow-sm hover:bg-indigo-700 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 
                       focus:ring-offset-2 sm:text-sm"
          >
            Enter different instructions
          </button>
        ) : (
          <button
            type="button"
            onClick={close}
            className="inline-flex w-full justify-center rounded-md 
                       border border-transparent bg-indigo-600 px-4 py-2 text-base 
                       font-medium text-white shadow-sm hover:bg-indigo-700 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 
                       focus:ring-offset-2 sm:text-sm"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}