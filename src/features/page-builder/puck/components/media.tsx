import { IconPickerField } from "@/features/page-builder/puck/fields/icon-picker";
import { RemSliderField } from "@/features/page-builder/puck/fields/rem-slider";
import { ColorPickerField } from "@/features/page-builder/puck/fields/color-picker";
import { linkPickerField } from "@/features/page-builder/puck/fields/link-picker";
import { mediaPickerField } from "@/features/page-builder/puck/fields/media-picker";
import {
  getSafeEmbedUrl,
  sanitizeLinkUrl,
  sanitizeMediaUrl,
} from "@/features/page-builder/puck/safety";
import type { PuckRenderProps } from "@/features/page-builder/puck/render-types";
import { getBuilderIcon } from "@/features/page-builder/puck/icon-registry";

type ImageProps = PuckRenderProps & {
  src?: string;
  alt?: string;
  caption?: string;
  href?: string;
  target?: "_self" | "_blank";
  aspectRatio?: string;
  rounded?: string;
  shadow?: string;
  objectPosition?: React.CSSProperties["objectPosition"];
  priority?: boolean;
};
type VideoProps = PuckRenderProps & {
  url?: string;
  title?: string;
  aspectRatio?: string;
};
type IconProps = PuckRenderProps & {
  icon?: string;
  size?: number;
  color?: string;
  align?: React.CSSProperties["justifyContent"];
};

const aspectRatioMap: Record<string, string> = {
  auto: "",
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "3/2": "aspect-[3/2]",
  "2/3": "aspect-[2/3]",
};

const roundedMap: Record<string, string> = {
  none: "",
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  full: "rounded-full",
};

const shadowMap: Record<string, string> = {
  none: "",
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
  xl: "shadow-[var(--shadow-lg)]",
};

export const mediaComponents = {
  Image: {
    label: "Image",
    fields: {
      src: mediaPickerField,
      alt: { type: "text" as const },
      caption: { type: "text" as const, contentEditable: true },
      href: linkPickerField,
      target: {
        type: "radio" as const,
        options: [
          { label: "Same tab", value: "_self" },
          { label: "New tab", value: "_blank" },
        ],
      },
      aspectRatio: {
        type: "select" as const,
        options: [
          { label: "Auto", value: "auto" },
          { label: "16:9 (Wide)", value: "16/9" },
          { label: "4:3 (Standard)", value: "4/3" },
          { label: "3:2 (Photo)", value: "3/2" },
          { label: "1:1 (Square)", value: "1/1" },
          { label: "2:3 (Portrait)", value: "2/3" },
        ],
      },
      rounded: {
        type: "select" as const,
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Full (Circle)", value: "full" },
        ],
      },
      shadow: {
        type: "select" as const,
        options: [
          { label: "None", value: "none" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
      objectPosition: {
        type: "select" as const,
        options: [
          { label: "Center", value: "center" },
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
          { label: "Start", value: "start" },
          { label: "End", value: "end" },
        ],
      },
      priority: {
        type: "radio" as const,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    },
    defaultProps: {
      src: "",
      alt: "",
      caption: "",
      href: "",
      target: "_self",
      aspectRatio: "auto",
      rounded: "md",
      shadow: "none",
      objectPosition: "center",
      priority: false,
    },
    render: (props: ImageProps) => {
      const {
        src = "",
        alt = "",
        caption,
        href = "",
        target = "_self",
        aspectRatio = "auto",
        rounded = "md",
        shadow = "none",
        objectPosition = "center",
        priority = false,
        puck,
      } = props;
      const safeSrc = sanitizeMediaUrl(src);

      if (!safeSrc) {
        return (
          <div className="border-border text-muted-foreground flex min-h-32 items-center justify-center rounded-xl border border-dashed text-sm">
            {puck.metadata.emptyImage ?? "No image selected"}
          </div>
        );
      }

      const aspectClass = aspectRatioMap[aspectRatio] ?? "";
      const roundedClass = roundedMap[rounded] ?? "rounded-xl";
      const shadowClass = shadowMap[shadow] ?? "";
      const wrapClass = [
        aspectClass,
        roundedClass,
        shadowClass,
        "overflow-hidden",
      ]
        .filter(Boolean)
        .join(" ");

      const image = (
        <figure className="space-y-2">
          <div className={wrapClass}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeSrc}
              alt={alt}
              className="h-full w-full object-cover"
              style={{ objectPosition }}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
            />
          </div>
          {caption && (
            <figcaption className="text-muted-foreground text-sm text-center">
              {caption}
            </figcaption>
          )}
        </figure>
      );
      const safeHref = sanitizeLinkUrl(href);
      return safeHref ? (
        <a
          href={safeHref}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
        >
          {image}
        </a>
      ) : (
        image
      );
    },
  },

  Video: {
    label: "Video",
    fields: {
      url: {
        type: "text" as const,
        placeholder: "https://youtube.com/watch?v=... or https://vimeo.com/...",
      },
      title: { type: "text" as const },
      aspectRatio: {
        type: "radio" as const,
        options: [
          { label: "16:9", value: "16/9" },
          { label: "4:3", value: "4/3" },
          { label: "1:1", value: "1/1" },
        ],
      },
    },
    defaultProps: {
      url: "",
      title: "Video",
      aspectRatio: "16/9",
    },
    render: (props: VideoProps) => {
      const { url = "", title = "Video", aspectRatio = "16/9", puck } = props;

      if (!url) {
        return (
          <div className="border-border text-muted-foreground flex min-h-40 items-center justify-center rounded-xl border border-dashed text-sm">
            {puck.metadata.emptyVideo ?? "No video URL"}
          </div>
        );
      }

      const embedUrl = getSafeEmbedUrl(url);
      const aspectClass = aspectRatioMap[aspectRatio] ?? "aspect-video";

      if (!embedUrl) {
        return (
          <div className="border-destructive text-destructive flex min-h-40 items-center justify-center rounded-xl border border-dashed text-sm">
            {puck.metadata.invalidVideo ?? "Invalid video URL"}
          </div>
        );
      }

      return (
        <div
          className={`${aspectClass} rounded-xl overflow-hidden border border-border`}
        >
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    },
  },

  Icon: {
    label: "Icon",
    fields: {
      icon: {
        type: "custom" as const,
        render: IconPickerField,
      },
      size: {
        type: "custom" as const,
        min: 0.75,
        max: 6,
        step: 0.25,
        render: RemSliderField,
      },
      color: {
        type: "custom" as const,
        render: ColorPickerField,
      },
      align: {
        type: "radio" as const,
        options: [
          { label: "Left", value: "flex-start" },
          { label: "Center", value: "center" },
          { label: "Right", value: "flex-end" },
        ],
      },
    },
    defaultProps: {
      icon: "Heart",
      size: 2,
      color: "currentColor",
      align: "center",
    },
    render: (props: IconProps) => {
      const {
        icon = "Heart",
        size = 2,
        color = "currentColor",
        align = "center",
      } = props;
      const IconComponent = getBuilderIcon(icon);

      return (
        <div style={{ display: "flex", justifyContent: align }}>
          {IconComponent ? (
            <IconComponent size={size * 16} color={color} strokeWidth={1.5} />
          ) : (
            <div
              style={{ width: size * 16, height: size * 16 }}
              className="rounded border border-border flex items-center justify-center text-muted-foreground text-xs"
            >
              ?
            </div>
          )}
        </div>
      );
    },
  },
};
