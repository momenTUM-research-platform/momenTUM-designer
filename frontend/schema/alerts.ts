export const alerts = {
  $id: "#/properties/modules/items/properties/alerts",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  title: "Alerts",
  description: "Define the notification title, message, schedule, and behavior.",
  default: {},
  examples: [
    {
      title: "Weekly Check-in",
      message: "Time for your weekly survey!",
      startDateTime: "2025-06-15T09:00:00",
      repeat: "weekly",
      until: "2025-12-31",
      random: false,
      randomInterval: 0,
      sticky: true,
      stickyLabel: "Surveys",
      timeout: false,
      timeoutAfter: 0
    }
  ],
  required: [
    "title",
    "message",
    "startDateTime",
    "repeat",
    "random",
    "randomInterval",
    "sticky",
    "stickyLabel",
    "timeout",
    "timeoutAfter"
  ],
  properties: {
    title: {
      type: "string",
      title: "Title",
      description: "Main notification text.",
      minLength: 1
    },
    message: {
      type: "string",
      title: "Message",
      description: "Secondary notification text.",
      minLength: 1
    },
    startDateTime: {
      type: "string",
      format: "date-time",
      title: "Date & time",
      description: "Initial notification date and time."
    },
    interval: {
      type: "integer",
      title: "Interval",
      description: "Number of repeat intervals (e.g. every 3 days).",
      minimum: 1,
      default: 1
    },
    repeat: {
      type: "string",
      title: "Repeat",
      enum: ["never", "daily", "weekly", "monthly", "yearly"],
      default: "never",
      description: "How often to repeat this notification."
    },
    until: {
      type: "string",
      format: "date",
      title: "Until",
      description: "Optional end date for repeating notifications (YYYY-MM-DD)."
    },
    random: {
      type: "boolean",
      title: "Randomise?",
      description: "Offset each notification by ±randomInterval minutes.",
      default: false
    },
    randomInterval: {
      type: "integer",
      title: "Random interval (min)",
      minimum: 0,
      default: 0
    },
    sticky: {
      type: "boolean",
      title: "Sticky?",
      description: "Keep notification available after it fires.",
      default: false
    },
    stickyLabel: {
      type: "string",
      title: "Sticky label",
      description: "Group label for sticky notifications.",
      default: ""
    },
    timeout: {
      type: "boolean",
      title: "Timeout?",
      description: "Remove the notification if not acted on within timeoutAfter ms.",
      default: false
    },
    timeoutAfter: {
      type: "integer",
      title: "Timeout after (ms)",
      minimum: 0,
      default: 0
    }
  },
  dependencies: {
    repeat: {
      oneOf: [
        {
          properties: { repeat: { const: "never" } }
        },
        {
          properties: { 
          repeat: { enum: ["daily", "weekly", "monthly", "yearly"] }, 
          interval: { type: "integer" }, 
          until: { type: "string", format: "date" } 
        }
        }
      ]
    }
  }
};