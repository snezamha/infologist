import type { Config } from "@puckeditor/core";
import { createElement } from "react";

const render = () => createElement("div");
const component = { render };

export const puckMigrationConfig = {
  components: {
    Columns: {
      fields: {
        col1: { type: "slot" },
        col2: { type: "slot" },
        col3: { type: "slot" },
        col4: { type: "slot" },
      },
      render,
    },
    Section: {
      fields: { content: { type: "slot" } },
      render,
    },
    FlexContainer: {
      fields: { content: { type: "slot" } },
      render,
    },
    VerticalSpace: component,
    Heading: component,
    RichText: component,
    Blockquote: component,
    List: component,
    CodeBlock: component,
    Image: component,
    Video: component,
    Icon: component,
    Card: component,
    Stats: component,
    Accordion: component,
    Table: component,
    ButtonLink: component,
    ButtonGroup: component,
    Badge: component,
    Separator: component,
  },
} satisfies Config;
