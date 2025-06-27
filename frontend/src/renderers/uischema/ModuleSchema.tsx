import React from "react"
import TitleWidget       from "./components/TitleWidget"
import DescriptionWidget from "./components/DescriptionWidget"
import ArrayFieldTemplate from "./components/ArrayFieldTemplate"
import { alerts as alertsSchema } from "../../../schema/alerts"
import { graph }       from "../../../schema/graph"
import { module as moduleSchema } from "../../../schema/module"

export const modulesSchema: Record<string, any> = {
  modal:   { "ui:widget": "radio" },
  hide_if: { "ui:widget": "radio" },

  // ————————————————————————————————————
  // ALERTS (single object per module)
  alerts: {
    // show the title/description from JSON‐schema
    "ui:title":       <TitleWidget Title={alertsSchema.title} />,
    "ui:description": <DescriptionWidget description={alertsSchema.description} />,

    // control the order of the fields inside it
    "ui:order": [
      "title","message",
      "startDateTime",
      "times",
      "repeat","interval","until",
      "random","randomInterval",
      "sticky","stickyLabel",
      "timeout","timeoutAfter"
    ],

    title:           { "ui:widget": "text"   },
    message:         { "ui:widget": "textarea" },
    startDateTime:   { "ui:widget": "date-time" },
    times: {
      "ui:ArrayFieldTemplate": ArrayFieldTemplate,
      "ui:options": { addable: true, removable: true},
      items: {
        "ui:widget" : "time"
      }
    },
    repeat:          { "ui:widget": "select" },
    interval:        { "ui:widget": "updown",   "ui:options": { min: 1 } },
    until:           { "ui:widget": "date"   },
    random:          { "ui:widget": "radio"  },
    randomInterval:  { "ui:widget": "updown" },
    sticky:          { "ui:widget": "radio"  },
    stickyLabel:     { "ui:widget": "text"   },
    timeout:         { "ui:widget": "radio"  },
    timeoutAfter:    { "ui:widget": "updown" },
  },

  // GRAPH
  graph: {
    display:        { "ui:widget": "radio" },
    "ui:title":     <TitleWidget Title={graph([]).title} />,
    "ui:description": <DescriptionWidget description={graph([]).description} />
  },

  unlock_after: {
    "ui:ArrayFieldTemplate": ArrayFieldTemplate,
    "ui:options":            { addable: true, removable: true }
  },
}