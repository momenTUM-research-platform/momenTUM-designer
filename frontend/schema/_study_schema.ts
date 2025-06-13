/* OBSOLETE */

export const study_object = (
  conditions: string[],
  questions: SchemaEnum[],
  modules: SchemaEnum[]
) => {
  return {
    $schema: "http://json-schema.org/draft-07/schema",
    $id: "https://momenTUM.de/schema/v1/schema.json",
    type: "object",
    title: "MomenTUM survey creator",
    description:
      "This is the schema for the MomenTUM survey creator. For any questions/issues please see the repository: https://github.com/TUMChronobiology/momenTUM-json-maker. IDs must consist of ONLY lower-case letters, numbers, and underscores.",
    default: {},
    required: ["properties", "modules"],
    properties: {
      properties: {
        $id: "#/properties/properties",
        type: "object",
        title: "Properties",
        description: "Stores the metadata of the study",
        default: {},
        examples: [
          {
            study_name: "Research Study",
            study_id: "RS2023XYZ",
            created_by: "Jane Doe",
            instructions: "Thank you for participating in our research study!",
            post_url: "https://researchstudy.com/api/v2/response",
            empty_msg: "You have completed all tasks.",
            banner_url: "https://researchstudy.com/images/banner.jpg",
            support_url: "https://researchstudy.com/support",
            support_email: "support@researchstudy.com",
            conditions: ["Control Group", "Experimental Group"],
            cache: false,
            ethics: "This study has been approved by the ethics committee under approval #RS2023ETHICS",
            pls: "https://researchstudy.com/pls-file-link.pdf",
          },
        ],
        required: [
          "study_name",
          "study_id",
          "created_by",
          "post_url",
          "empty_msg",
          "banner_url",
          "conditions",
          "cache",
        ],
        properties: {
          study_name: {
            $id: "#/properties/properties/properties/study_name",
            type: "string",
            title: "Name",
            description: "The name of the current study.",
            default: "",
            minLength: 3,
            examples: ["Research Study"],
          },
          study_id: {
            $id: "#/properties/properties/properties/study_id",
            type: "string",
            pattern: "^[a-zA-Z0-9_]+$",
            title: "ID",
            description: "An identifier for the study which is sent to the server with response data.",
            default: "",
            minLength: 3,
            examples: ["RS2023XYZ"],
          },
          created_by: {
            $id: "#/properties/properties/properties/created_by",
            type: "string",
            title: "Created by",
            description: "The name of the creator or author of the study.",
            default: "",
            minLength: 3,
            examples: ["Jane Doe"],
          },
          instructions: {
            $id: "#/properties/properties/properties/instructions",
            type: "string",
            title: "Instructions",
            description: "Brief instructions for participants in the study.",
            default: "",
            minLength: 3,
            examples: ["Thank you for participating in our research study!"],
          },
          post_url: {
            $id: "#/properties/properties/properties/post_url",
            type: "string",
            title: "Post URL",
            description: "URL where participant responses are sent.",
            default: "https://researchstudy.com/api/v2/response",
          },
          empty_msg: {
            $id: "#/properties/properties/properties/empty_msg",
            type: "string",
            title: "Empty Message",
            description: "Message shown when no tasks are available.",
            default: "",
            minLength: 3,
            examples: ["You have completed all tasks."],
          },
          banner_url: {
            $id: "#/properties/properties/properties/banner_url",
            type: "string",
            title: "Banner URL",
            description: "URL of an image displayed in the study app.",
            default: "",
            minLength: 3,
            examples: ["https://researchstudy.com/images/banner.jpg"],
          },
          support_url: {
            $id: "#/properties/properties/properties/support_url",
            type: "string",
            title: "Support URL",
            description: "URL for study support or homepage.",
            default: "",
            minLength: 3,
            examples: ["https://researchstudy.com/support"],
          },
          support_email: {
            $id: "#/properties/properties/properties/support_email",
            type: "string",
            title: "Support Email",
            description: "Email for participant support.",
            default: "",
            minLength: 3,
            examples: ["support@researchstudy.com"],
          },
          cache: {
            $id: "#/properties/properties/properties/cache",
            type: "boolean",
            title: "Cache Media?",
            description: "Indicates if media is cached for offline use.",
            default: true,
          },
          ethics: {
            $id: "#/properties/properties/properties/ethics",
            type: "string",
            title: "Ethics Statement",
            description: "Statement about study ethics.",
            default: "",
            minLength: 3,
            examples: ["This study has been approved by the ethics committee."],
          },
          pls: {
            $id: "#/properties/properties/properties/pls",
            type: "string",
            title: "Plain Language Statement",
            description: "URL to a PDF with the Plain Language Statement.",
            default: "",
            minLength: 3,
            examples: ["https://researchstudy.com/pls-file-link.pdf"],
          },
          conditions: {
            $id: "#/properties/properties/properties/conditions",
            type: "array",
            title: "Conditions",
            description: "List of conditions participants can be assigned to.",
            default: ["Control Group", "Experimental Group"],
            examples: [["Control Group", "Experimental Group"]],
            items: {
              $id: "#/properties/properties/properties/conditions/items",
              type: "string",
              minLength: 1,
            },
          },
        },
      },
      modules: {
        $id: "#/properties/modules",
        type: "array",
        "minItems": 1,
        title: "Modules",
        description:
          "Modules store the individual survey/intervention tasks that will be delivered to the participants.",
        default: [],
        items: {
          $id: "#/properties/modules/items",
          type: "object",
          required: [
            "name",
            "condition",
            "alerts",
            "graph",
            "id",
            "unlock_after",
            "params",
          ],
          properties: {
            id: {
              $id: "#/properties/modules/items/properties/id",
              type: "string",
              pattern: "^[a-z0-9_]+$",
              title: "Unique identifier",
              description:
                "A unique identifier for this module. Will be generated if not provided. Must be lowercase and only letters, numbers and underscores. Cannot begin with a number",
              default: "",
              examples: [""],
            },
            params: {
              $id: "#/properties/modules/items/properties/params",
              type: "object",
              title: "Module Type",
              description:
                "The parameters of the module. Can be a survey object or a pvt object, but not both.",
              required: [],
              properties: {},
              oneOf: [
                {
                  $id: "#/properties/modules/items/properties/params/survey",
                  title: "Survey",
                  type: "object",
                  description:
                    "The parameters of the module. Can be a survey object or a PVT object, but not both.",
                  properties: {
                    sections: {
                      $id: "#/properties/modules/items/properties/survey/sections",
                      type: "array",
                      "minItems": 1,
                      title: "Sections",
                      default: [],
                      description:
                        "The section of a survey. It can be multiple entries",
                      items: {
                        $id: "#/properties/modules/items/properties/sections/items",
                        type: "object",
                        required: ["name", "questions", "shuffle"],
                        properties: {
                       
                          name: {
                            $id: "#/properties/modules/items/properties/sections/items/properties/name",
                            type: "string",
                            title: "Section name",
                            description:
                              "The title of this section, which is displayed at the top of the screen.",
                            default: "",
                            examples: ["Welcome"],
                          },
                          shuffle: {
                            $id: "#/properties/modules/items/properties/sections/items/properties/shuffle",
                            type: "boolean",
                            title: "Shuffle Questions?",
                            description:
                              "Used for counterbalancing. If true, the order of the questions in this section will be randomised.",
                            default: false,
                            examples: [false],
                          },
                          questions: {
                            $id: "#/properties/modules/items/properties/sections/items/properties/questions",
                            type: "array",
                            "minItems": 1,
                            title: "Questions",
                            description:
                              "An array containing all of the questions for this section of the module.",
                            default: [],
                            items: {
                              $id: "#/properties/modules/items/properties/sections/items/properties/questions/items",
                              type: "object",
                              required: ["id", "type", "text", "required"],
                              properties: {
                                id: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/id",
                                  type: "string",
                                  pattern: "^[a-z0-9_]+$",
                                  title: "Question ID",
                                  description:
                                    "A unique id to identify this question. This id is sent to the server along with any response value. Note: Every element in the entire study protocol must have a unique id for some features to function correctly.",
                                  default: "",
                                  examples: ["instruction-1wnjocfw"],
                                },
                                text: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/text",
                                  type: "string",
                                  title: "Text",
                                  description:
                                    "The label displayed alongside the question. Basic HTML supported.",
                                  default: "",
                                  examples: [
                                    "Hello! Welcome to the study! This module only shows for those enrolled in the control condition.",
                                  ],
                                },
                                required: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/required",
                                  type: "boolean",
                                  title: "Required",
                                  description:
                                    "Denotes whether this question is required to be answered. The app will force the participant to answer all required questions that are not hidden by branching.",
                                  default: false,
                                  examples: [false, true],
                                },
                                hide_id: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/hide_id",
                                  type: "string",
                                  pattern: "^[a-z0-9_]+$",
                                  title: "Hide/Show for ID",
                                  description:
                                    "The id of the question that will trigger this question to dynamically show/hide. To use branching, you need to add two additional properties to the question object that is to be dynamically shown/hidden. Currently, branching is supported by the multi, yesno, and slider question types.",
                                  default: "none",
                                },
                                hide_value: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/hide_value",
                                  type: "string",
                                  title: "Hide/show value",
                                  description:
                                    "The value that needs to be selected in the question denoted by hide_id which will make this question appear. When using sliders, the value should be prefixed with a direction and is inclusive, e.g. >50 or <50.",
                                  default: "",
                                  examples: [""],
                                },
                                hide_if: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/hide_if",
                                  type: "boolean",
                                  title:
                                    "Hide or show if answer equals hide value? ",
                                  description:
                                    "Indicates the branching behaviour. If true, the element will disappear if the value of the question equals hide_value. If false, the element will appear instead.",
                                  default: false,
                                  examples: [true],
                                  enum: ["Hide", "Show"],
                                },
                                rand_group: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/rand_group",
                                  type: "string",
                                  title: "Random Group identifier",
                                  description:
                                    "An identifier that groups a set of elements together so that only one will randomly appear every time a module is accessed. Note: To identify which element was visible, it will be given a response value of 1. If the element can record a response this value will be replaced with that response. All hidden elements will record no response.",
                                  default: "",
                                  oneOf: [
                                    {
                                      const: "",
                                      title:
                                        "None (This will create an empty field, don't worry)",
                                    },
                                    {
                                      const: "A",
                                      title: "A",
                                    },
                                    {
                                      const: "B",
                                      title: "B",
                                    },
                                    {
                                      const: "C",
                                      title: "C",
                                    },
                                    {
                                      const: "D",
                                      title: "D",
                                    },
                                    {
                                      const: "E",
                                      title: "E",
                                    },
                                    {
                                      const: "F",
                                      title: "F",
                                    },
                                  ],
                                },
                                type: {
                                  $id: "#/properties/modules/items/properties/sections/items/properties/questions/items/anyOf/0/properties/type",
                                  type: "string",
                                  title: "Type",
                                  description:
                                    "The primary type of this question. ",
                                  default: "instruction",
                                  enum: [
                                    "instruction",
                                    "datetime",
                                    "multi",
                                    "text",
                                    "slider",
                                    "media",
                                    "yesno",
                                  ],
                                },
                              },
                              dependencies: {
                                type: {
                                  oneOf: [
                                    {
                                      properties: {
                                        type: {
                                          const: "instruction",
                                        },
                                      },
                                    },
                                    {
                                      required: ["subtype"],
                                      properties: {
                                        subtype: {
                                          type: "string",
                                          title: "Subtype",
                                          description:
                                            "The specific type of text input for this field.",
                                          enum: ["short", "long", "numeric"],
                                        },
                                        type: {
                                          enum: ["text"],
                                        },
                                      },
                                    },
                                    {
                                      required: ["subtype"],
                                      properties: {
                                        type: {
                                          enum: ["datetime"],
                                        },
                                        subtype: {
                                          type: "string",
                                          title: "Subtype",
                                          enum: ["date", "time", "datetime"],
                                          description:
                                            "The specific type of date/time input for this field. Accepted values are date (datepicker only), time (timepicker only), and datetime (both).",
                                        },
                                      },
                                    },
                                    {
                                      required: ["yes_text", "no_text"],
                                      properties: {
                                        type: {
                                          enum: ["yesno"],
                                        },
                                        yes_text: {
                                          type: "string",
                                          title: "Yes Text",
                                          description:
                                            "The label for a true/yes response.",
                                        },
                                        no_text: {
                                          type: "string",
                                          title: "No Text",
                                          description:
                                            "The label for a false/no response.",
                                        },
                                      },
                                    },
                                    {
                                      required: [
                                        "min",
                                        "max",
                                        "hint_left",
                                        "hint_right",
                                      ],
                                      properties: {
                                        type: {
                                          enum: ["slider"],
                                        },
                                        min: {
                                          type: "number",
                                          title: "Minimum",
                                          description:
                                            "The minimum value for the slider.",
                                        },
                                        max: {
                                          type: "number",
                                          title: "Maximum",
                                          description:
                                            "The maximum value for the slider.",
                                        },
                                        hint_left: {
                                          type: "string",
                                          title: "Hint Left",
                                          description:
                                            "The label for the left side of the slider.",
                                        },
                                        hint_right: {
                                          type: "string",
                                          title: "Hint Right",
                                          description:
                                            "The label for the right side of the slider.",
                                        },
                                      },
                                    },
                                    {
                                      required: [
                                        "radio",
                                        "modal",
                                        "shuffle",
                                        "options",
                                      ],
                                      properties: {
                                        type: {
                                          enum: ["multi"],
                                        },
                                        radio: {
                                          type: "boolean",
                                          title: "Radio buttons?",
                                          description:
                                            "Denotes whether the multiple choice should be radio buttons (one selection only) or checkboxes (multiple selections allowed).",
                                        },
                                        modal: {
                                          type: "boolean",
                                          title: "Modal?",
                                          description:
                                            "Denotes whether the selections should appear in a modal popup (good for longer lists)",
                                        },
                                        shuffle: {
                                          type: "boolean",
                                          title: "Shuffle?",
                                          description:
                                            "Denotes whether the selections should be shuffled.",
                                        },
                                        options: {
                                          type: "array",
                                          title: "Options",
                                          description:
                                            "The list of choices to display.",
                                          items: {
                                            type: "string",
                                          },
                                        },
                                      },
                                    },
                                    {
                                      required: ["subtype", "src"],
                                      properties: {
                                        type: {
                                          enum: ["media"],
                                        },
                                        subtype: {
                                          type: "string",
                                          title: "Subtype",
                                          description:
                                            "The type of media. Accepted values are video, audio, and image.",
                                          enum: ["video", "audio", "image"],
                                          default: "video",
                                        },
                                        src: {
                                          type: "string",
                                          title: "Source",
                                          description:
                                            "A direct URL to the media source.",
                                        },
                                      },
                                      dependencies: {
                                        subtype: {
                                          oneOf: [
                                            {
                                              properties: {
                                                subtype: {
                                                  const: "video",
                                                },
                                                thumb: {
                                                  type: "string",
                                                  title: "Thumbnail",
                                                  description:
                                                    "Required for video elements. A direct URL to the placeholder image that is displayed in the video player while loading.",
                                                },
                                              },
                                              required: ["thumb"],
                                            },
                                            {
                                              properties: {
                                                subtype: {
                                                  const: "audio",
                                                },
                                              },
                                            },
                                            {
                                              properties: {
                                                subtype: {
                                                  const: "image",
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    submit_text: {
                      $id: "#/properties/modules/items/properties/submit_text",
                      type: "string",
                      title: "Submit Text",
                      description:
                        "The label of the submit button for this module. Note: this value appears only on the final section of a module.",
                      default: "Submit",
                      examples: ["Submit"],
                    },
                    type: {
                      type: "string",
                      enum: ["survey"],
                    },
                    shuffle: {
                      $id: "#/properties/modules/items/properties/params/survey/shuffle",
                      type: "boolean",
                      title: "Shuffle sections?",
                      description:
                        "Used for counterbalancing. If true, the order of the sections will be randomized every time the module is accessed.",
                    },
                  },
                  required: ["sections", "shuffle", "submit_text","type"],
                },
                {
                  $id: "#/properties/modules/items/properties/params/pvt",
                  type: "object",
                  title: "PVT",
                  description:
                    "The parameters of the module. Can be a survey object or a PVT object, but not both.",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["pvt"],
                    },
                    trials: {
                      $id: "#/properties/modules/items/properties/params/pvt/trials",
                      type: "number",
                      minimum: 0,
                      title: "Number of trials",
                      description:
                        "How many trials should be displayed to the user?",
                    },
                    min_waiting: {
                      $id: "#/properties/modules/items/properties/params/pvt/min_waiting",
                      type: "number",
                      minimum: 0,
                      title: "Minimum waiting period",
                      description:
                        "How long should the user minimally have to wait before the trigger? In milliseconds",
                    },
                    max_waiting: {
                      $id: "#/properties/modules/items/properties/params/pvt/max_waiting",
                      type: "number",
                      minimum: 0,
                      title: "Maximum waiting period",
                      description:
                        "How long should the user maximally have to wait before the trigger? In milliseconds",
                    },
                    max_reaction: {
                      $id: "#/properties/modules/items/properties/params/pvt/max_reaction",
                      type: "number",
                      minimum: 0,
                      title: "Time to timeout",
                      description:
                        "How long until timeout when the user does not react? In milliseconds",
                    },
                    show: {
                      $id: "#/properties/modules/items/properties/params/pvt/show",
                      type: "boolean",
                      title: "Show results to the user?",
                    },
                    exit: {
                      $id: "#/properties/modules/items/properties/params/pvt/exit",
                      type: "boolean",
                      title: "Enable exit from PVT?",
                    },
                  },
                  required: [
                    "type",
                    "trials",
                    "min_waiting",
                    "max_waiting",
                    "max_reaction",
                  ],
                },
              ],
            },
            name: {
              $id: "#/properties/modules/items/properties/name",
              type: "string",
              title: "Name",
              description: "The name of the module. Basic HTML supported.",
              default: "",
              examples: ["Welcome"],
            },
            condition: {
              $id: "#/properties/modules/items/properties/condition",
              type: "string",
              title: "Condition",
              description:
                "The condition that this module belongs to. It must match one of the values from the conditions array from the study properties, or have the value * to be scheduled for all participants.",
              default: "",
              enum: conditions,
            },
            alerts: {
              $id: "#/properties/modules/items/properties/alerts",
              type: "object",
              title: "Alerts",
              description: "Define alerts to be displayed to the user.",
              default: {},
              examples: [
                {
                  title: "Welcome to the study",
                  message: "Tap to open the app",
                  // one-off example:
                  startDateTime: "2025-06-15T08:30:00Z",
                  random: false,
                  randomInterval: 0,
                  sticky: true,
                  stickyLabel: "Start here",
                  timeout: false,
                  timeoutAfter: 0,
                }
              ],
              required: [
                "title",
                "message",
                "random",
                "randomInterval",
                "sticky",
                "stickyLabel",
                "timeout",
                "timeoutAfter",
              ],
              oneOf: [
                { required: ["startDateTime"] },
                { required: ["rrule"] },
                { required: ["recurrence"] }
              ],
              properties: {
                title: {
                  type: "string",
                  title: "Title",
                  minLength: 3,
                  description: "Notification title (main text).",
                },
                message: {
                  type: "string",
                  title: "Message",
                  minLength: 3,
                  description: "Notification message (secondary text).",
                },
                startDateTime: {
                  type: "string",
                  format: "date-time",
                  title: "One-off date & time",
                  description: "Specify a single alert date/time.",
                },
                rrule: {
                  type: "string",
                  title: "Recurrence rule",
                  description: "RFC-5545 RRULE string, e.g. FREQ=WEEKLY;BYDAY=MO,TH;BYHOUR=9;BYMINUTE=0",
                },
                recurrence: {
                  type: "object",
                  title: "Structured recurrence",
                  properties: {
                    frequency: {
                      type: "string",
                      enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
                    },
                    interval: {
                      type: "integer",
                      minimum: 1,
                      default: 1,
                    },
                    byWeekday: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
                      },
                    },
                    byMonthday: {
                      type: "array",
                      items: {
                        type: "integer",
                        minimum: 1,
                        maximum: 31,
                      },
                    },
                    byHour: {
                      type: "integer",
                      minimum: 0,
                      maximum: 23,
                    },
                    byMinute: {
                      type: "integer",
                      minimum: 0,
                      maximum: 59,
                    },
                    until: {
                      type: "string",
                      format: "date",
                      description: "Date to end the recurrence (YYYY-MM-DD).",
                    },
                  },
                  additionalProperties: false,
                },
                random: {
                  type: "boolean",
                  title: "Randomised alerts?",
                  description: "If true, alert times will be offset by randomInterval minutes.",
                  default: false,
                },
                randomInterval: {
                  type: "integer",
                  title: "Random interval",
                  description: "Minutes before/after scheduled time to randomise alerts.",
                  minimum: 0,
                  default: 0,
                },
                sticky: {
                  type: "boolean",
                  title: "Sticky?",
                  description: "Keep this task available after completion.",
                  default: false,
                },
                stickyLabel: {
                  type: "string",
                  title: "Sticky label",
                  description: "Label for sticky tasks grouping.",
                  minLength: 1,
                  default: "",
                },
                timeout: {
                  type: "boolean",
                  title: "Timeout?",
                  description: "Remove task after timeoutAfter milliseconds.",
                  default: false,
                },
                timeoutAfter: {
                  type: "integer",
                  title: "Timeout after",
                  description: "Milliseconds after which the task is removed.",
                  minimum: 0,
                  default: 0,
                },
              },
            },
            graph: {
              $id: "#/properties/modules/items/properties/graph",
              type: "object",
              title: "Graph",
              description: "Graphs allow visualisation of study data.",
              default: {},
              examples: [
                {
                  display: false,
                },
              ],
              required: ["display"],
              properties: {
                display: {
                  $id: "#/properties/modules/items/properties/graph/properties/display",
                  type: "boolean",
                  title: "Display graph?",
                  description:
                    "Indicates whether this module displays a feedback graph in the Feedback tab. If the value is false, the remaining variables are ignored.",
                  default: false,
                  enum: [true, false],
                },
              },
              dependencies: {
                display: {
                  oneOf: [
                    {
                      properties: {
                        display: {
                          enum: [false],
                        },
                      },
                    },
                    {
                      required: [
                        "variable",
                        "title",
                        "blurb",
                        "type",
                        "max_points",
                      ],
                      properties: {
                        display: {
                          enum: [true],
                        },
                        variable: {
                          $id: "#/properties/modules/items/properties/graph/properties/variable",
                          type: "string",
                          title: "Variable",
                          description:
                            "The id of a question object to graph. It must match one of the module's question ids.",
                          default: "none",
                        },
                        title: {
                          $id: "#/properties/modules/items/properties/graph/properties/title",
                          type: "string",
                          title: "Title",
                          description:
                            "The title of the graph to be displayed in the Feedback tab.",
                          default: "",
                          examples: [""],
                        },
                        blurb: {
                          $id: "#/properties/modules/items/properties/graph/properties/blurb",
                          type: "string",
                          title: "Blurb",
                          description:
                            "A brief description of the graph to be displayed below it in the feedback tab. Basic HTML supported.",
                          default: "",
                          examples: [""],
                        },
                        type: {
                          $id: "#/properties/modules/items/properties/graph/properties/type",
                          type: "string",
                          title: "Type",
                          description:
                            "The type of graph to display. One of: bar or line",
                          default: "bar",
                          enum: ["bar", "line"],
                          examples: ["bar", "line"],
                        },
                        max_points: {
                          $id: "#/properties/modules/items/properties/graph/properties/max_points",
                          type: "integer",
                          title: "Max points",
                          description:
                            "The maximum number of data points to display in the graph, e.g. 10 will only show the ten most recent responses.",
                          default: 10,
                          examples: [0, 10],
                        },
                      },
                    },
                  ],
                },
              },
            },
            unlock_after: {
              $id: "#/properties/modules/items/properties/unlock_after",
              type: "array",
              title: "Unlock after",
              description:
                "A list of IDs of modules that must be completed before this module will appear on the task list. If you cannot see any ids, please remove the field and add it again. Self-reference will exclude the module.",
              examples: [[]],
              items: {
                $id: "#/properties/modules/items/properties/unlock_after/items",
                type: "string",
                pattern: "^[a-z0-9_]+$",
              },
            },
          },
        },
      },
    },
  };
};
