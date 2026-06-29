import type { Config, Data } from "@puckeditor/core";

import { layoutComponents } from "./components/layout";
import { typographyComponents } from "./components/typography";
import { mediaComponents } from "./components/media";
import { contentComponents } from "./components/content";
import { navigationComponents } from "./components/navigation";
import { marketingComponents } from "./components/marketing";

export const puckConfig = {
  root: {
    fields: {},
  },
  categories: {
    basics: {
      title: "Basics",
      components: ["Heading", "RichText", "Image", "ButtonLink", "Section"],
      defaultExpanded: true,
    },
    readyMade: {
      title: "Ready-made sections",
      components: [
        "Hero",
        "Gallery",
        "Testimonials",
        "LogoCloud",
        "ContactCta",
        "ContactForm",
      ],
      defaultExpanded: false,
    },
    layout: {
      title: "Layout",
      components: ["Columns", "FlexContainer", "VerticalSpace"],
      defaultExpanded: false,
    },
    more: {
      title: "More",
      components: [
        "Blockquote",
        "List",
        "CodeBlock",
        "Video",
        "Icon",
        "Card",
        "Stats",
        "Accordion",
        "Table",
        "ButtonGroup",
        "Badge",
        "Separator",
      ],
      defaultExpanded: false,
    },
  },
  components: {
    ...layoutComponents,
    ...typographyComponents,
    ...mediaComponents,
    ...contentComponents,
    ...navigationComponents,
    ...marketingComponents,
  },
} satisfies Config;

export type PuckConfig = typeof puckConfig;
export type PuckData = Data<PuckConfig["components"]>;
