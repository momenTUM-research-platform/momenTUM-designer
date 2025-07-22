import React from "react";
import TitleWidget from "./components/TitleWidget";
import DescriptionWidget from "./components/DescriptionWidget";
import ArrayFieldTemplate from "./components/ArrayFieldTemplate";
import { alerts as alertsSchema } from "../../../schema/alerts";
import { graph } from "../../../schema/graph";
import { module as moduleSchema } from "../../../schema/module";

export const modulesSchema: Record<string, any> = {
  modal:   { "ui:widget": "radio" },
  hide_if: { "ui:widget": "radio" },

  // ————————————————————————————————————
  // ALERTS (single object per module)
  alerts: {
    // show the title/description from JSON-schema
    "ui:title":       <TitleWidget Title={alertsSchema.title} />,
    "ui:description": <DescriptionWidget description={alertsSchema.description} />,

    // define the order of fields, including new scheduling options
    "ui:order": [
      "title",
      "message",
      "scheduleMode",             // absolute vs. relative
      "expectedEnrollmentDate",   // preview date for relative mode
      "startDateTime",            // absolute start date/time
      "offsetDays",               // days after enrollment
      "offsetTime",               // time on offset day
      "times",
      "repeat",
      "interval",
      "repeatCount",              // number of repeats for relative mode
      "until",                    // end date for absolute mode
      "random",
      "randomInterval",
      "sticky",
      "stickyLabel",
      "timeout",
      "timeoutAfter"
    ],

    // scheduling mode toggle
    scheduleMode: {
      "ui:widget": "radio",
      "ui:options": {
        inline: true
      }
    },

    // preview enrollment date (designer only)
    expectedEnrollmentDate: {
      "ui:widget": "date"
    },

    // absolute calendar scheduling
    startDateTime: {
      "ui:widget": "date-time"
    },

    // relative scheduling fields
    offsetDays: {
      "ui:widget": "updown",
      "ui:options": { min: 0 }
    },
    offsetTime: {
      "ui:widget": "time"
    },

    // notification content fields
    title: {
      "ui:widget": "text"
    },
    message: {
      "ui:widget": "textarea"
    },

    // additional times of day
    times: {
      "ui:ArrayFieldTemplate": ArrayFieldTemplate,
      "ui:options": { addable: true, removable: true },
      items: {
        "ui:widget": "time"
      }
    },

    // repeat settings
    repeat: {
      "ui:widget": "select"
    },
    interval: {
      "ui:widget": "updown",
      "ui:options": { min: 1 }
    },
    repeatCount: {
      "ui:widget": "updown",
      "ui:options": { min: 1 }
    },
    until: {
      "ui:widget": "date"
    },

    // randomization, stickiness, timeout
    random: {
      "ui:widget": "radio"
    },
    randomInterval: {
      "ui:widget": "updown"
    },
    sticky: {
      "ui:widget": "radio"
    },
    stickyLabel: {
      "ui:widget": "text"
    },
    timeout: {
      "ui:widget": "radio"
    },
    timeoutAfter: {
      "ui:widget": "updown"
    }
  },

  // GRAPH
  graph: {
    display:        { "ui:widget": "radio" },
    "ui:title":     <TitleWidget Title={graph([]).title} />,
    "ui:description": <DescriptionWidget description={graph([]).description} />
  },

  // UNLOCK_AFTER 
  unlock_after: {
    "ui:ArrayFieldTemplate": ArrayFieldTemplate,
    "ui:options":            { addable: true, removable: true }
  }
};