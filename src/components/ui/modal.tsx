"use client";

import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModalProps = React.ComponentProps<typeof Dialog> & {
  title: ReactNode;
  description?: ReactNode;
  descriptionAsChild?: boolean;
  trigger?: ReactElement;
  children?: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
};

function Modal({
  title,
  description,
  descriptionAsChild,
  trigger,
  children,
  footer,
  contentClassName,
  bodyClassName,
  ...props
}: ModalProps) {
  const t = useTranslations("common");

  return (
    <Dialog {...props}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        closeLabel={t("menu.close")}
        className={cn("grid-rows-[auto_minmax(0,1fr)_auto]", contentClassName)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription
              render={descriptionAsChild ? <div /> : undefined}
            >
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children && (
          <div
            className={cn(
              "min-h-0 min-w-0 overflow-y-auto overscroll-contain",
              bodyClassName,
            )}
          >
            {children}
          </div>
        )}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export { Modal, DialogClose as ModalClose };
