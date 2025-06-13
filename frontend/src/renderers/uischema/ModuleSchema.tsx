import React from "react";
import { module } from "../../../schema/module";
import TitleWidget from "./components/TitleWidget";
import ArrayFieldTemplate from "./components/ArrayFieldTemplate";
import { alerts } from "../../../schema/alerts";
import DescriptionWidget from "./components/DescriptionWidget";
import { graph } from "../../../schema/graph";

export const modulesSchema: { [key: string]: any } = {
  modal: { "ui:widget": "radio" },
  hide_if: { "ui:widget": "radio" },

  alerts: {
    "ui:title": <TitleWidget Title={alerts.title} />,
    "ui:description": (
      <DescriptionWidget description={alerts.description} />
    ),
    "ui:order": [
      "title",
      "message",
      "startDateTime",
      "repeat",
      "interval",
      "until",
      "random",
      "randomInterval",
      "sticky",
      "stickyLabel",
      "timeout",
      "timeoutAfter",
    ],
    startDateTime: { "ui:widget": "date-time" },
    repeat: {
      "ui:widget": "select",
    },
    interval: {
      "ui:widget": "updown",
      "ui:options": {
        min: 1,
      },
    },
    until: { "ui:widget": "date" },
    random: { "ui:widget": "radio" },
    randomInterval: { "ui:widget": "updown" },
    sticky: { "ui:widget": "radio" },
    stickyLabel: { "ui:widget": "text" },
    timeout: { "ui:widget": "radio" },
    timeoutAfter: { "ui:widget": "updown" },
  },

  graph: {
    display: { "ui:widget": "radio" },
    "ui:title": <TitleWidget Title={graph([]).title} />,
    "ui:description": <DescriptionWidget description={graph([]).description} />,
  },

  unlock_after: {
    "ui:title": (
      <TitleWidget Title={module([], [], []).properties.unlock_after.title} />
    ),
    "ui:description": (
      <DescriptionWidget
        description={module([], [], []).properties.unlock_after.description}
      />
    ),
    "ui:ArrayFieldTemplate": ArrayFieldTemplate,
    "ui:options": { addable: true, removable: true },
  },
};