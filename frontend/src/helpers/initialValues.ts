import { Properties, Module, Params, Section, TextQuestion } from "../types";

export const initialProperties: Properties = {
  _type: "properties",
  study_name: "Study",
  study_id: String(),
  created_by: String(),
  instructions: String(),
  post_url: "https://designer.momentumresearch.eu/api/v2",
  empty_msg: String(),
  banner_url: String(),
  support_url: String(),
  support_email: String(),
  conditions: ["Control", "Treatment"],
  cache: false,
  ethics: String(),
  pls: String(),
};

export const initialModule = (id: string): Module => ({
  _type: "module",
  id,
  name: "",
  condition: "",
  unlock_after: [],
  graph: { display: false },
  params: { _type: "params" },
  alerts: {
    // switch default to relative
    scheduleMode: "relative",

    // content
    title: "",
    message: "",

    // relative fields (all valid)
    offsetDays:    0,
    offsetTime:    "00:00",
    repeatCount:   0,

    // common defaults
    repeat:        "never",
    interval:      1,
    times:         [],

    random:        false,
    randomInterval: 0,
    sticky:        false,
    stickyLabel:   "",
    timeout:       false,
    timeoutAfter:  0,
  },
});

export const initialParamSurvey = (id: string): Params => {
  return {
    _type: "params",
    type: "survey",
    id,
    submit_text: "Submit",
    shuffle: false,
    sections: [],
  };
};

export const initialParamPVT = (id: string): Params => {
  return {
    _type: "params",
    id,
    type: "pvt",
    trials: 0,
    min_waiting: 0,
    max_waiting: 0,
    max_reaction: 0,
  };
};

export const initialSection = (id: string): Section => {
  return {
    _type: "section",
    id,
    name: String(),
    questions: [],
    shuffle: false,
  };
};

export const initialQuestion = (id: string): TextQuestion => {
  return {
    _type: "question",
    id,
    rand_group: String(),
    required: true,
    text: String(),
    type: "text",
    subtype: "short",
    min_value: undefined,
    max_value: undefined,
  };
};