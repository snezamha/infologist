import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 flex min-h-24 w-full resize-y rounded-md border px-3 py-2.5 text-start text-sm leading-relaxed shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/50 read-only:cursor-default read-only:resize-none read-only:focus-visible:ring-0 read-only:focus-visible:border-input",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
