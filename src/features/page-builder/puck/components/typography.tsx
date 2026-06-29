const headingLevelMap: Record<string, string> = {
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-3xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold tracking-tight",
  h4: "text-xl font-semibold",
  h5: "text-lg font-medium",
  h6: "text-base font-medium",
};

const headingColorMap: Record<string, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
};

const alignMap: Record<string, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

const headingSizeMap: Record<string, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
  "2xl": "text-5xl",
};

import { sanitizeHtmlId } from "@/features/page-builder/puck/safety";

export const typographyComponents = {
  Heading: {
    label: "Heading",
    fields: {
      text: { type: "text" as const, contentEditable: true },
      level: {
        type: "select" as const,
        options: [
          { label: "H1", value: "h1" },
          { label: "H2", value: "h2" },
          { label: "H3", value: "h3" },
          { label: "H4", value: "h4" },
          { label: "H5", value: "h5" },
          { label: "H6", value: "h6" },
        ],
      },
      size: {
        type: "select" as const,
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "X-Large", value: "xl" },
          { label: "2X-Large", value: "2xl" },
        ],
      },
      responsiveSize: responsiveScaleField,
      align: {
        type: "radio" as const,
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
          { label: "End", value: "end" },
        ],
      },
      color: {
        type: "radio" as const,
        options: [
          { label: "Default", value: "default" },
          { label: "Muted", value: "muted" },
          { label: "Primary", value: "primary" },
        ],
      },
      anchorId: { type: "text" as const },
    },
    defaultProps: {
      text: "Heading",
      level: "h2",
      size: "lg",
      responsiveSize: { mobile: "md", tablet: "lg", desktop: "xl" },
      align: "start",
      color: "default",
      anchorId: "",
    },
    render: (props: HeadingProps) => {
      const {
        text,
        level = "h2",
        size = "lg",
        responsiveSize,
        align = "start",
        color = "default",
        anchorId = "",
      } = props;
      const id = sanitizeHtmlId(anchorId) || undefined;
      const className = [
        headingLevelMap[level] ?? headingLevelMap.h2,
        responsiveSize
          ? getResponsiveTextClass(responsiveSize)
          : (headingSizeMap[size] ?? headingSizeMap.lg),
        headingColorMap[color] ?? "text-foreground",
        alignMap[align] ?? "text-start",
      ].join(" ");

      if (level === "h1")
        return (
          <h1 id={id} className={className}>
            {text}
          </h1>
        );
      if (level === "h3")
        return (
          <h3 id={id} className={className}>
            {text}
          </h3>
        );
      if (level === "h4")
        return (
          <h4 id={id} className={className}>
            {text}
          </h4>
        );
      if (level === "h5")
        return (
          <h5 id={id} className={className}>
            {text}
          </h5>
        );
      if (level === "h6")
        return (
          <h6 id={id} className={className}>
            {text}
          </h6>
        );
      return (
        <h2 id={id} className={className}>
          {text}
        </h2>
      );
    },
  },

  RichText: {
    label: "Rich Text",
    fields: {
      content: {
        type: "richtext" as const,
      },
    },
    defaultProps: {
      content: "<p>Start writing your content here...</p>",
    },
    render: (props: RichTextProps) => {
      const { content = "" } = props;
      return (
        <div
          className="prose prose-sm max-w-none text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_a]:text-primary"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
        />
      );
    },
  },

  Blockquote: {
    label: "Blockquote",
    fields: {
      text: { type: "textarea" as const, contentEditable: true },
      author: { type: "text" as const, contentEditable: true },
      source: { type: "text" as const, contentEditable: true },
    },
    defaultProps: {
      text: "The only way to do great work is to love what you do.",
      author: "",
      source: "",
    },
    render: (props: BlockquoteProps) => {
      const { text, author, source } = props;
      return (
        <blockquote className="border-primary/30 my-6 border-s-4 ps-6">
          <p className="text-foreground/90 text-lg font-medium italic leading-8">
            {text}
          </p>
          {(author || source) && (
            <footer className="text-muted-foreground mt-3 text-sm">
              {author && (
                <cite className="not-italic font-medium">{author}</cite>
              )}
              {author && source && <span> — </span>}
              {source && <span>{source}</span>}
            </footer>
          )}
        </blockquote>
      );
    },
  },

  List: {
    label: "List",
    fields: {
      type: {
        type: "radio" as const,
        options: [
          { label: "Unordered", value: "unordered" },
          { label: "Ordered", value: "ordered" },
        ],
      },
      items: {
        type: "array" as const,
        arrayFields: {
          text: { type: "text" as const, contentEditable: true },
        },
        getItemSummary: (item: ListItem) => item.text || "Item",
      },
    },
    defaultProps: {
      type: "unordered",
      items: [
        { text: "First item" },
        { text: "Second item" },
        { text: "Third item" },
      ],
    },
    render: (props: ListProps) => {
      const { type = "unordered", items = [] } = props;
      const Tag = type === "ordered" ? "ol" : "ul";
      const listClass =
        type === "ordered"
          ? "list-decimal list-inside space-y-2 text-foreground/90"
          : "list-disc list-inside space-y-2 text-foreground/90";

      return (
        <Tag className={listClass}>
          {items.map((item, i) => (
            <li key={i} className="text-base leading-7">
              {item.text}
            </li>
          ))}
        </Tag>
      );
    },
  },

  CodeBlock: {
    label: "Code Block",
    fields: {
      code: { type: "textarea" as const },
      language: {
        type: "select" as const,
        options: [
          { label: "Plain Text", value: "text" },
          { label: "JavaScript", value: "javascript" },
          { label: "TypeScript", value: "typescript" },
          { label: "Python", value: "python" },
          { label: "HTML", value: "html" },
          { label: "CSS", value: "css" },
          { label: "Shell / Bash", value: "bash" },
          { label: "JSON", value: "json" },
          { label: "SQL", value: "sql" },
          { label: "Markdown", value: "markdown" },
        ],
      },
    },
    defaultProps: {
      code: 'console.log("Hello, world!");',
      language: "javascript",
    },
    render: (props: CodeBlockProps) => {
      const { code, language = "text" } = props;
      return (
        <div className="rounded-xl overflow-hidden border border-border">
          {language !== "text" && (
            <div className="bg-muted/80 px-4 py-2 border-b border-border">
              <span className="text-muted-foreground text-xs font-mono">
                {language}
              </span>
            </div>
          )}
          <pre className="bg-muted/40 overflow-x-auto p-4">
            <code className="text-sm font-mono text-foreground/90 whitespace-pre">
              {code}
            </code>
          </pre>
        </div>
      );
    },
  },
};
import { sanitizeRichText } from "@/features/page-builder/puck/safety";
import type { PuckRenderProps } from "@/features/page-builder/puck/render-types";
import {
  getResponsiveTextClass,
  responsiveScaleField,
  type ResponsiveScale,
} from "@/features/page-builder/puck/responsive";

type HeadingProps = PuckRenderProps & {
  text?: string;
  level?: string;
  size?: string;
  responsiveSize?: ResponsiveScale;
  align?: string;
  color?: string;
  anchorId?: string;
};
type RichTextProps = PuckRenderProps & { content?: string };
type BlockquoteProps = PuckRenderProps & {
  text?: string;
  author?: string;
  source?: string;
};
type ListItem = { text: string };
type ListProps = PuckRenderProps & {
  type?: "ordered" | "unordered";
  items?: ListItem[];
};
type CodeBlockProps = PuckRenderProps & { code?: string; language?: string };
