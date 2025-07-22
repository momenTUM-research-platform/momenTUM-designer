// src/types/types.d.ts

declare type AtomVariants =
  | "study"
  | "module"
  | "section"
  | "question"
  | "properties"
  | "params";

declare type Actions = "create" | "delete" | "earlier" | "later";

declare type Mode = "graph" | "timeline";

declare type Atoms = Map<
  string,
  Atom<Study | Properties | Question | Module | Section | Params>
>;

declare interface SchemaEnum {
  id: string;
  text: string;
}

declare interface Atom<T> {
  parent: string | null;
  subNodes: string[] | null;
  type: AtomVariants;
  childType: AtomVariants | null;
  content: T;
  title: string; // Displayed on node
  actions: Actions[];
  hidden: boolean;
}

declare interface Occurence {
  id: string;
  timestamp: number;
  name: string;
  time: string;
  datetime: string; // YYYY-MM-DD'T'HH:MM
  condition: string;
  module: string; // id of module
}

declare type Days = Occurence[][];

declare interface Day {
  date: string; // "YYYY-MM-DD"
  isCurrentMonth?: boolean;
  isSelected?: boolean;
  isToday?: boolean;
  events: Occurence[];
}

declare interface Study {
  _type: "study";
  _id?: { $oid: string };
  timestamp?: number;
  properties: Properties;
  modules: Module[];
}

declare interface Properties {
  _type: "properties";
  study_id: string;
  study_name: string;
  instructions: string;
  banner_url: string;
  support_email: string;
  support_url: string;
  ethics: string;
  pls: string;
  created_by: string;
  empty_msg: string;
  post_url: string;
  conditions: string[];
  cache: boolean;
}

declare interface Module {
  _type: "module";
  id: string;
  name: string;
  condition: string;
  unlock_after: string[];
  graph:
    | {
        display: true;
        variable: string;
        title: string;
        blurb: string;
        type: "bar" | "line";
        max_points: number;
      }
    | { display: false };
  params: Params;
  alerts: {
    /** Use calendar dates (absolute) or offset from enrollment (relative) */
    scheduleMode: "absolute" | "relative";
    /** Preview date for relative schedules (designer only) */
    expectedEnrollmentDate?: string;
    /** Initial date/time for absolute mode */
    startDateTime?: string;
    /** Days after enrollment for first notification */
    offsetDays?: number;
    /** Time of day (HH:MM) on offset day for first notification */
    offsetTime?: string;
    /** Notification title text */
    title: string;
    /** Notification message/body text */
    message: string;
    /** Extra times of day for this alert (HH:MM strings) */
    times: string[];
    /** How often to repeat this notification */
    repeat: "never" | "daily" | "weekly" | "monthly" | "yearly";
    /** Repeat interval count (e.g., every N days/weeks) */
    interval: number;
    /** Number of additional notifications after the first (relative mode) */
    repeatCount?: number;
    /** End date for repeating notifications (YYYY-MM-DD, absolute mode) */
    until?: string;
    /** Offset each notification by ±randomInterval minutes */
    random: boolean;
    /** Maximum minutes to randomize before/after scheduled time */
    randomInterval: number;
    /** Keep notification visible until acted on */
    sticky: boolean;
    /** Label for grouping sticky notifications */
    stickyLabel: string;
    /** Remove notification if not acted on within timeoutAfter ms */
    timeout: boolean;
    /** Milliseconds before notification times out */
    timeoutAfter: number;
  };
}

declare interface Params {
  _type: "params";
  id?: string;
  type?: string;
  trials?: number;
  min_waiting?: number;
  max_waiting?: number;
  show?: boolean;
  max_reaction?: number;
  exit?: boolean;
  submit_text?: string;
  shuffle?: boolean;
  sections?: Section[];
}

declare interface Section {
  _type: "section";
  id: string;
  name: string;
  shuffle: boolean;
  questions: (
    | Instruction
    | TextQuestion
    | DateTime
    | YesNo
    | Slider
    | Multi
    | Media
    | External
  )[];
}

declare interface Question {
  _type: "question";
  id: string;
  text: string;
  required: boolean;
  rand_group: string;
  hide_id?: string;
  hide_value?: string | boolean;
  hide_if?: boolean;
  noToggle?: boolean;
  response?: number | string | any[];
  hideSwitch?: boolean;
  model?: string | number;
  hideError?: boolean;
  value?: number;
}

interface Instruction extends Question {
  type: "instruction";
}
interface TextQuestion extends Question {
  type: "text";
  subtype: "short" | "long" | "numeric";
  /** Optional minimum allowed value */
  min_value?: number;
  /** Optional maximum allowed value */
  max_value?: number;
}
interface DateTime extends Question {
  type: "datetime";
  subtype: "date" | "time" | "datetime";
}
interface YesNo extends Question {
  type: "yesno";
  yes_text: string;
  no_text: string;
}
interface Slider extends Question {
  type: "slider";
  min: number;
  max: number;
  hint_left: string;
  hint_right: string;
}
interface Multi extends Question {
  type: "multi";
  radio: boolean;
  modal: boolean;
  options: string[];
  optionsChecked?: Option[];
  shuffle: boolean;
}
interface Media extends Question {
  type: "media";
  subtype: "image" | "video" | "audio";
  src: string;
  thumb?: string;
}
interface External extends Question {
  type: "external";
  src: string;
}

interface Option {
  text: string;
  checked: boolean;
}