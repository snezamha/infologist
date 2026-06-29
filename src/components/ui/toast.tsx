"use client";

import { Toast } from "@base-ui/react/toast";
import { CheckCircle, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/toast-manager";

function ToastIcon({ type }: { type?: string }) {
  if (type === "success")
    return <CheckCircle className="size-4 shrink-0 text-green-500" />;
  if (type === "error")
    return <XCircle className="text-destructive size-4 shrink-0" />;
  return <Info className="text-muted-foreground size-4 shrink-0" />;
}

function Toaster() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport className="fixed end-4 bottom-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-0 outline-none">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          className={cn(
            "bg-background ring-border flex w-full items-start gap-3 rounded-xl p-4 shadow-lg ring-1",
            "data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0",
            "transition-all duration-200",
          )}
        >
          <ToastIcon type={toast.type} />
          <div className="min-w-0 flex-1">
            {toast.title && (
              <Toast.Title className="text-sm leading-snug font-medium">
                {toast.title}
              </Toast.Title>
            )}
            {toast.description && (
              <Toast.Description className="text-muted-foreground mt-0.5 text-sm">
                {toast.description}
              </Toast.Description>
            )}
          </div>
          <Toast.Close
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-sm transition-colors focus:outline-none focus-visible:ring-2"
          >
            <X className="size-4" />
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}

export { Toast, Toaster, toastManager };
