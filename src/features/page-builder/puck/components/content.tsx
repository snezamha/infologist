const cardVariantMap: Record<string, string> = {
  default:
    "bg-card border border-border rounded-[var(--radius-lg)] p-[var(--spacing-md)]",
  outline:
    "border border-border rounded-[var(--radius-lg)] p-[var(--spacing-md)]",
  ghost: "p-[var(--spacing-md)]",
  elevated:
    "bg-card rounded-[var(--radius-lg)] p-[var(--spacing-md)] shadow-[var(--shadow-md)]",
};

const statsColMap: Record<string, string> = {
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
};

export const contentComponents = {
  Card: {
    label: "Card",
    fields: {
      title: { type: "text" as const, contentEditable: true },
      description: { type: "textarea" as const, contentEditable: true },
      imageSrc: mediaPickerField,
      imageAlt: { type: "text" as const },
      buttonLabel: { type: "text" as const, contentEditable: true },
      buttonHref: linkPickerField,
      buttonTarget: {
        type: "radio" as const,
        options: [
          { label: "Same tab", value: "_self" },
          { label: "New tab", value: "_blank" },
        ],
      },
      variant: {
        type: "radio" as const,
        options: [
          { label: "Default", value: "default" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
          { label: "Elevated", value: "elevated" },
        ],
      },
    },
    defaultProps: {
      title: "Card Title",
      description: "A short description of this card content.",
      imageSrc: "",
      imageAlt: "",
      buttonLabel: "",
      buttonHref: "",
      buttonTarget: "_self",
      variant: "default",
    },
    render: (props: CardProps) => {
      const {
        title,
        description,
        imageSrc = "",
        imageAlt = "",
        buttonLabel,
        buttonHref = "",
        buttonTarget = "_self",
        variant = "default",
      } = props;
      const cardClass = cardVariantMap[variant] ?? cardVariantMap.default;
      const safeImageSrc = sanitizeMediaUrl(imageSrc);
      const safeButtonHref = sanitizeLinkUrl(buttonHref);

      return (
        <div className={cardClass}>
          {safeImageSrc && (
            <div className="mb-4 overflow-hidden rounded-lg aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safeImageSrc}
                alt={imageAlt}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          {title && (
            <h3 className="text-foreground text-lg font-semibold mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
              {description}
            </p>
          )}
          {buttonLabel && safeButtonHref && (
            <div className="mt-4">
              <a
                href={safeButtonHref}
                target={buttonTarget}
                rel={
                  buttonTarget === "_blank" ? "noopener noreferrer" : undefined
                }
                className="text-primary text-sm font-medium hover:underline underline-offset-4"
              >
                {buttonLabel}
              </a>
            </div>
          )}
        </div>
      );
    },
  },

  Stats: {
    label: "Stats",
    fields: {
      items: {
        type: "array" as const,
        arrayFields: {
          value: { type: "text" as const, contentEditable: true },
          label: { type: "text" as const, contentEditable: true },
          description: { type: "text" as const, contentEditable: true },
        },
        getItemSummary: (item: StatItem) => item.label || item.value || "Stat",
        defaultItemProps: { value: "0", label: "Metric", description: "" },
      },
      columns: {
        type: "radio" as const,
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
      responsiveColumns: responsiveColumnsField,
      align: {
        type: "radio" as const,
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
        ],
      },
    },
    defaultProps: {
      items: [
        { value: "10K+", label: "Users", description: "" },
        { value: "99.9%", label: "Uptime", description: "" },
        { value: "24/7", label: "Support", description: "" },
      ],
      columns: "3",
      responsiveColumns: { mobile: "1", tablet: "2", desktop: "3" },
      align: "center",
    },
    render: (props: StatsProps) => {
      const {
        items = [],
        columns = "3",
        responsiveColumns,
        align = "center",
      } = props;
      const colClass = responsiveColumns
        ? getResponsiveColumnsClass(responsiveColumns)
        : (statsColMap[columns] ?? "grid-cols-3");
      const alignClass = align === "center" ? "text-center" : "text-start";

      return (
        <div className={`grid ${colClass} gap-8`}>
          {items.map((item, i) => (
            <div key={i} className={alignClass}>
              <div className="text-foreground text-3xl font-bold tracking-tight">
                {item.value}
              </div>
              <div className="text-foreground font-medium mt-1">
                {item.label}
              </div>
              {item.description && (
                <div className="text-muted-foreground text-sm mt-1">
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    },
  },

  Accordion: {
    label: "Accordion / FAQ",
    fields: {
      items: {
        type: "array" as const,
        arrayFields: {
          question: { type: "text" as const, contentEditable: true },
          answer: { type: "textarea" as const, contentEditable: true },
        },
        getItemSummary: (item: AccordionItem) => item.question || "Question",
        defaultItemProps: { question: "Question", answer: "Answer" },
      },
      separated: {
        type: "radio" as const,
        options: [
          { label: "Bordered", value: "bordered" },
          { label: "Separated", value: "separated" },
        ],
      },
      singleOpen: {
        type: "radio" as const,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    },
    defaultProps: {
      items: [
        {
          question: "What is this?",
          answer: "This is an accordion component.",
        },
        {
          question: "How does it work?",
          answer: "Click a question to expand or collapse the answer.",
        },
      ],
      separated: "bordered",
      singleOpen: false,
    },
    render: (props: AccordionProps) => {
      const { items = [], separated = "bordered", singleOpen = false } = props;

      if (separated === "separated") {
        return (
          <div className="space-y-3">
            {items.map((item, i) => (
              <details
                key={i}
                name={singleOpen ? `accordion-${props.id}` : undefined}
                className="group border border-border rounded-xl overflow-hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-foreground hover:bg-muted/50 transition-colors list-none">
                  <span>{item.question}</span>
                  <span className="text-muted-foreground ms-4 shrink-0 transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <div className="px-5 pb-4 pt-0 text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        );
      }

      return (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {items.map((item, i) => (
            <details
              key={i}
              name={singleOpen ? `accordion-${props.id}` : undefined}
              className="group"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-foreground hover:bg-muted/50 transition-colors list-none">
                <span>{item.question}</span>
                <span className="text-muted-foreground ms-4 shrink-0 transition-transform group-open:rotate-180">
                  ↓
                </span>
              </summary>
              <div className="px-5 pb-4 text-muted-foreground text-sm leading-6 bg-muted/20 whitespace-pre-wrap">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      );
    },
  },

  Table: {
    label: "Table",
    fields: {
      caption: { type: "text" as const },
      headers: {
        type: "array" as const,
        arrayFields: {
          label: { type: "text" as const },
        },
        getItemSummary: (item: TableHeader) => item.label || "Column",
        defaultItemProps: { label: "Column" },
      },
      rows: {
        type: "array" as const,
        arrayFields: {
          cells: { type: "text" as const },
        },
        getItemSummary: (_item: TableRow, i?: number) => `Row ${(i ?? 0) + 1}`,
        defaultItemProps: { cells: "" },
      },
      striped: {
        type: "radio" as const,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    },
    defaultProps: {
      caption: "",
      headers: [{ label: "Name" }, { label: "Value" }, { label: "Status" }],
      rows: [
        { cells: "Item A | 100 | Active" },
        { cells: "Item B | 200 | Inactive" },
        { cells: "Item C | 300 | Active" },
      ],
      striped: true,
    },
    render: (props: TableProps) => {
      const { caption, headers = [], rows = [], striped = true } = props;

      return (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            {caption && (
              <caption className="text-muted-foreground text-sm py-2 px-4 text-start">
                {caption}
              </caption>
            )}
            {headers.length > 0 && (
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="text-foreground font-medium text-start px-4 py-3"
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border">
              {rows.map((row, ri) => {
                const cells = String(row.cells || "")
                  .split("|")
                  .map((c: string) => c.trim());
                return (
                  <tr
                    key={ri}
                    className={striped && ri % 2 === 1 ? "bg-muted/20" : ""}
                  >
                    {cells.map((cell: string, ci: number) => (
                      <td key={ci} className="text-foreground/90 px-4 py-3">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    },
  },
};
import { linkPickerField } from "@/features/page-builder/puck/fields/link-picker";
import { mediaPickerField } from "@/features/page-builder/puck/fields/media-picker";
import {
  getResponsiveColumnsClass,
  responsiveColumnsField,
  type ResponsiveColumns,
} from "@/features/page-builder/puck/responsive";
import {
  sanitizeLinkUrl,
  sanitizeMediaUrl,
} from "@/features/page-builder/puck/safety";
import type { PuckRenderProps } from "@/features/page-builder/puck/render-types";

type CardProps = PuckRenderProps & {
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  buttonLabel?: string;
  buttonHref?: string;
  buttonTarget?: "_self" | "_blank";
  variant?: string;
};
type StatItem = { value: string; label: string; description: string };
type StatsProps = PuckRenderProps & {
  items?: StatItem[];
  columns?: string;
  responsiveColumns?: Partial<ResponsiveColumns>;
  align?: string;
};
type AccordionItem = { question: string; answer: string };
type AccordionProps = PuckRenderProps & {
  items?: AccordionItem[];
  separated?: string;
  singleOpen?: boolean;
};
type TableHeader = { label: string };
type TableRow = { cells: string };
type TableProps = PuckRenderProps & {
  caption?: string;
  headers?: TableHeader[];
  rows?: TableRow[];
  striped?: boolean;
};
