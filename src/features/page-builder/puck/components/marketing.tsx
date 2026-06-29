import { linkPickerField } from "@/features/page-builder/puck/fields/link-picker";
import { mediaPickerField } from "@/features/page-builder/puck/fields/media-picker";
import {
  responsiveColumnsField,
  getResponsiveColumnsClass,
  type ResponsiveColumns,
} from "@/features/page-builder/puck/responsive";
import {
  sanitizeLinkUrl,
  sanitizeMediaUrl,
} from "@/features/page-builder/puck/safety";
import type { PuckRenderProps } from "@/features/page-builder/puck/render-types";

type HeroProps = PuckRenderProps & {
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  imageSrc?: string;
  imageAlt?: string;
  align?: "start" | "center";
};

type GalleryProps = PuckRenderProps & {
  images?: Array<{ src: string; alt: string; caption: string }>;
  responsiveColumns?: Partial<ResponsiveColumns>;
};

type TestimonialsProps = PuckRenderProps & {
  items?: Array<{ quote: string; name: string; role: string }>;
  responsiveColumns?: Partial<ResponsiveColumns>;
};

type LogoCloudProps = PuckRenderProps & {
  title?: string;
  logos?: Array<{ src: string; alt: string }>;
};

type ContactCtaProps = PuckRenderProps & {
  title?: string;
  description?: string;
  email?: string;
  buttonLabel?: string;
};

type ContactFormProps = PuckRenderProps & {
  title?: string;
  description?: string;
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
  buttonLabel?: string;
  actionUrl?: string;
};

export const marketingComponents = {
  Hero: {
    label: "Hero",
    fields: {
      eyebrow: { type: "text" as const, contentEditable: true },
      title: { type: "text" as const, contentEditable: true },
      description: { type: "textarea" as const, contentEditable: true },
      primaryLabel: { type: "text" as const, contentEditable: true },
      primaryHref: linkPickerField,
      secondaryLabel: { type: "text" as const, contentEditable: true },
      secondaryHref: linkPickerField,
      imageSrc: mediaPickerField,
      imageAlt: { type: "text" as const },
      align: {
        type: "radio" as const,
        options: [
          { label: "Start", value: "start" },
          { label: "Center", value: "center" },
        ],
      },
    },
    defaultProps: {
      eyebrow: "",
      title: "A clear headline for your page",
      description: "Explain the value of this page in one short paragraph.",
      primaryLabel: "Get started",
      primaryHref: "/",
      secondaryLabel: "Learn more",
      secondaryHref: "#more",
      imageSrc: "",
      imageAlt: "",
      align: "start",
    },
    render: (props: HeroProps) => {
      const {
        eyebrow,
        title,
        description,
        primaryLabel,
        primaryHref,
        secondaryLabel,
        secondaryHref,
        imageSrc,
        imageAlt,
        align = "start",
      } = props;
      const safeImage = sanitizeMediaUrl(imageSrc ?? "");
      const safePrimary = sanitizeLinkUrl(primaryHref ?? "");
      const safeSecondary = sanitizeLinkUrl(secondaryHref ?? "");
      const centered = align === "center";

      return (
        <section className="bg-background px-[var(--spacing-md)] py-[var(--spacing-lg)]">
          <div
            className={`mx-auto grid max-w-6xl items-center gap-10 ${safeImage ? "md:grid-cols-2" : ""}`}
          >
            <div className={centered ? "text-center" : "text-start"}>
              {eyebrow ? (
                <p className="text-primary mb-3 text-sm font-semibold">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-foreground text-4xl font-bold tracking-tight md:text-6xl">
                {title}
              </h1>
              {description ? (
                <p className="text-muted-foreground mt-5 text-lg leading-8">
                  {description}
                </p>
              ) : null}
              <div
                className={`mt-7 flex flex-wrap gap-3 ${centered ? "justify-center" : "justify-start"}`}
              >
                {primaryLabel && safePrimary ? (
                  <a
                    href={safePrimary}
                    className="bg-primary text-primary-foreground rounded-[var(--radius-md)] px-5 py-3 text-sm font-medium"
                  >
                    {primaryLabel}
                  </a>
                ) : null}
                {secondaryLabel && safeSecondary ? (
                  <a
                    href={safeSecondary}
                    className="border-border text-foreground rounded-[var(--radius-md)] border px-5 py-3 text-sm font-medium"
                  >
                    {secondaryLabel}
                  </a>
                ) : null}
              </div>
            </div>
            {safeImage ? (
              <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={safeImage}
                  alt={imageAlt ?? ""}
                  className="size-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </section>
      );
    },
  },
  Gallery: {
    label: "Gallery",
    fields: {
      images: {
        type: "array" as const,
        arrayFields: {
          src: mediaPickerField,
          alt: { type: "text" as const },
          caption: { type: "text" as const },
        },
        getItemSummary: (item: { alt?: string }) => item.alt || "Image",
        defaultItemProps: { src: "", alt: "", caption: "" },
      },
      responsiveColumns: responsiveColumnsField,
    },
    defaultProps: {
      images: [],
      responsiveColumns: { mobile: "1", tablet: "2", desktop: "3" },
    },
    render: ({ images = [], responsiveColumns }: GalleryProps) => (
      <div
        className={`grid gap-4 ${getResponsiveColumnsClass(responsiveColumns ?? {})}`}
      >
        {images.map((image, index) => {
          const src = sanitizeMediaUrl(image.src);
          if (!src) return null;
          return (
            <figure key={`${src}-${index}`} className="space-y-2">
              <div className="aspect-square overflow-hidden rounded-[var(--radius-lg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={image.alt}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              {image.caption ? (
                <figcaption className="text-muted-foreground text-sm">
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>
    ),
  },
  Testimonials: {
    label: "Testimonials",
    fields: {
      items: {
        type: "array" as const,
        arrayFields: {
          quote: { type: "textarea" as const, contentEditable: true },
          name: { type: "text" as const, contentEditable: true },
          role: { type: "text" as const, contentEditable: true },
        },
        getItemSummary: (item: { name?: string }) => item.name || "Testimonial",
        defaultItemProps: { quote: "", name: "", role: "" },
      },
      responsiveColumns: responsiveColumnsField,
    },
    defaultProps: {
      items: [
        {
          quote: "This made our work simpler and faster.",
          name: "Customer name",
          role: "Role or company",
        },
      ],
      responsiveColumns: { mobile: "1", tablet: "2", desktop: "3" },
    },
    render: ({ items = [], responsiveColumns }: TestimonialsProps) => (
      <div
        className={`grid gap-4 ${getResponsiveColumnsClass(responsiveColumns ?? {})}`}
      >
        {items.map((item, index) => (
          <figure
            key={`${item.name}-${index}`}
            className="bg-card border-border rounded-[var(--radius-lg)] border p-[var(--spacing-md)]"
          >
            <blockquote className="text-foreground leading-7">
              “{item.quote}”
            </blockquote>
            <figcaption className="mt-5">
              <p className="text-foreground text-sm font-semibold">
                {item.name}
              </p>
              {item.role ? (
                <p className="text-muted-foreground text-sm">{item.role}</p>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    ),
  },
  LogoCloud: {
    label: "Logo Cloud",
    fields: {
      title: { type: "text" as const, contentEditable: true },
      logos: {
        type: "array" as const,
        arrayFields: {
          src: mediaPickerField,
          alt: { type: "text" as const },
        },
        getItemSummary: (item: { alt?: string }) => item.alt || "Logo",
        defaultItemProps: { src: "", alt: "" },
      },
    },
    defaultProps: { title: "Trusted by", logos: [] },
    render: ({ title, logos = [] }: LogoCloudProps) => (
      <div className="space-y-6 text-center">
        {title ? (
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-8">
          {logos.map((logo, index) => {
            const src = sanitizeMediaUrl(logo.src);
            if (!src) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${index}`}
                src={src}
                alt={logo.alt}
                loading="lazy"
                className="h-9 w-auto max-w-36 object-contain opacity-70 grayscale"
              />
            );
          })}
        </div>
      </div>
    ),
  },
  ContactCta: {
    label: "Contact CTA",
    fields: {
      title: { type: "text" as const, contentEditable: true },
      description: { type: "textarea" as const, contentEditable: true },
      email: { type: "text" as const },
      buttonLabel: { type: "text" as const, contentEditable: true },
    },
    defaultProps: {
      title: "Ready to talk?",
      description: "Tell us what you are working on.",
      email: "hello@example.com",
      buttonLabel: "Contact us",
    },
    render: ({ title, description, email, buttonLabel }: ContactCtaProps) => {
      const href = sanitizeLinkUrl(`mailto:${email ?? ""}`);
      return (
        <section className="bg-primary text-primary-foreground rounded-[var(--radius-lg)] p-[var(--spacing-lg)] text-center">
          <h2 className="text-3xl font-bold">{title}</h2>
          {description ? (
            <p className="mt-3 opacity-80">{description}</p>
          ) : null}
          {buttonLabel && href ? (
            <a
              href={href}
              className="bg-background text-foreground mt-6 inline-flex rounded-[var(--radius-md)] px-5 py-3 text-sm font-medium"
            >
              {buttonLabel}
            </a>
          ) : null}
        </section>
      );
    },
  },
  ContactForm: {
    label: "Contact Form",
    fields: {
      title: { type: "text" as const, contentEditable: true },
      description: { type: "textarea" as const, contentEditable: true },
      nameLabel: { type: "text" as const },
      emailLabel: { type: "text" as const },
      messageLabel: { type: "text" as const },
      buttonLabel: { type: "text" as const, contentEditable: true },
      actionUrl: linkPickerField,
    },
    defaultProps: {
      title: "Contact us",
      description: "Send a message and we will get back to you.",
      nameLabel: "Name",
      emailLabel: "Email",
      messageLabel: "Message",
      buttonLabel: "Send message",
      actionUrl: "",
    },
    render: ({
      title,
      description,
      nameLabel,
      emailLabel,
      messageLabel,
      buttonLabel,
      actionUrl,
    }: ContactFormProps) => {
      const action = sanitizeLinkUrl(actionUrl ?? "");
      return (
        <section className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-foreground text-3xl font-bold">{title}</h2>
            {description ? (
              <p className="text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <form
            action={action || undefined}
            method="post"
            className="space-y-4"
          >
            <label className="text-foreground grid gap-2 text-sm font-medium">
              {nameLabel}
              <input
                name="name"
                required
                className="border-border bg-background rounded-[var(--radius-md)] border px-3 py-2"
              />
            </label>
            <label className="text-foreground grid gap-2 text-sm font-medium">
              {emailLabel}
              <input
                name="email"
                type="email"
                required
                dir="ltr"
                className="border-border bg-background rounded-[var(--radius-md)] border px-3 py-2"
              />
            </label>
            <label className="text-foreground grid gap-2 text-sm font-medium">
              {messageLabel}
              <textarea
                name="message"
                required
                rows={5}
                className="border-border bg-background rounded-[var(--radius-md)] border px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={!action}
              className="bg-primary text-primary-foreground rounded-[var(--radius-md)] px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buttonLabel}
            </button>
          </form>
        </section>
      );
    },
  },
};
