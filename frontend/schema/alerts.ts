export const alerts = {
  $id: "#/properties/modules/items/properties/alerts",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  title: "Alerts",
  description: "Define the notification title, message, schedule, and behavior.",
  default: {},

  examples: [
    // Absolute scheduling example
    {
      title: "Weekly Check-in",
      message: "Time for your weekly survey!",
      scheduleMode: "absolute",
      startDateTime: "2025-06-15T09:00:00",
      repeat: "weekly",
      interval: 1,
      until: "2025-12-31",
      random: false,
      randomInterval: 0,
      sticky: true,
      stickyLabel: "Surveys",
      timeout: false,
      timeoutAfter: 0,
      times: []
    },
    // Relative scheduling example
    {
      title: "Day-1 Survey",
      message: "Complete your Day 1 survey.",
      scheduleMode: "relative",
      expectedEnrollmentDate: "2025-07-25",
      offsetDays: 1,
      offsetTime: "10:30",
      repeat: "daily",
      interval: 1,
      repeatCount: 4,
      random: false,
      randomInterval: 0,
      sticky: false,
      stickyLabel: "",
      timeout: false,
      timeoutAfter: 0,
      times: []
    }
  ],

  // Top-level required fields (common to both modes)
  required: [
    "scheduleMode",
    "title",
    "message",
    "repeat",
    "interval",
    "random",
    "randomInterval",
    "sticky",
    "stickyLabel",
    "timeout",
    "timeoutAfter"
  ],

  properties: {
    scheduleMode: {
      type: "string",
      title: "Schedule mode",
      enum: ["absolute", "relative"],
      default: "absolute",
      description: "Choose absolute (calendar) or relative (enrollment) scheduling."
    },

    // Absolute mode fields
    startDateTime: {
      type: "string",
      format: "date-time",
      title: "Start date & time",
      description: "Initial notification date & time for absolute mode."
    },
    until: {
      type: "string",
      format: "date",
      title: "Until",
      description: "End date for repeating notifications (YYYY-MM-DD) in absolute mode."
    },

    // Relative mode fields
    expectedEnrollmentDate: {
      type: "string",
      format: "date",
      title: "Expected enrollment",
      description: "Assumed enrollment date for preview in the designer."
    },
    offsetDays: {
      type: "integer",
      minimum: 0,
      title: "Offset days",
      description: "Days after enrollment for the first notification."
    },
    offsetTime: {
      type: "string",
      format: "time",
      title: "Offset time",
      description: "Time of day (HH:MM) on offset day for the first notification."
    },
    repeatCount: {
      type: "integer",
      minimum: 0,
      title: "Repeat count",
      description: "Number of additional notifications after the first (relative mode)."
    },

    // Notification content & common settings
    title: { type: "string", minLength: 1, title: "Title" },
    message: { type: "string", minLength: 1, title: "Message" },
    times: {
      type: "array",
      title: "Additional times",
      items: { type: "string", format: "time" },
      default: []
    },
    repeat: {
      type: "string",
      enum: ["never", "daily", "weekly", "monthly", "yearly"],
      default: "never",
      title: "Repeat"
    },
    interval: {
      type: "integer",
      minimum: 1,
      default: 1,
      title: "Interval"
    },
    random: { type: "boolean", default: false, title: "Randomise?" },
    randomInterval: {
      type: "integer",
      minimum: 0,
      default: 0,
      title: "Random interval (min)"
    },
    sticky: { type: "boolean", default: false, title: "Sticky?" },
    stickyLabel: { type: "string", default: "", title: "Sticky label" },
    timeout: { type: "boolean", default: false, title: "Timeout?" },
    timeoutAfter: {
      type: "integer",
      minimum: 0,
      default: 0,
      title: "Timeout after (ms)"
    }
  },

  dependencies: {
    // When repeat != never, interval still applies;
    // no direct dependency on repeatCount/until here.
    repeat: {
      oneOf: [
        { properties: { repeat: { const: "never" } } },
        {
          properties: {
            repeat: { enum: ["daily","weekly","monthly","yearly"] },
            interval: { type: "integer" }
          }
        }
      ]
    }
  },

  // Mode‐specific requirements
  oneOf: [
    {
      title: "Absolute schedule",
      properties: { scheduleMode: { const: "absolute" } },
      required: ["scheduleMode","startDateTime","until"]
    },
    {
      title: "Relative schedule",
      properties: { scheduleMode: { const: "relative" } },
      required: ["scheduleMode","offsetDays","offsetTime","repeatCount"]
    }
  ]
};