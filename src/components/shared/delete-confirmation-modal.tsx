"use client";

import { useId, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalClose } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputHint: string;
  expectedValue: string;
  confirmationValue: string;
  onConfirmationValueChange: (value: string) => void;
  isPending?: boolean;
  onConfirm: (confirmationValue: string) => void | Promise<void>;
};

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  inputLabel,
  inputPlaceholder,
  inputHint,
  expectedValue,
  confirmationValue,
  onConfirmationValueChange,
  isPending = false,
  onConfirm,
}: Props) {
  const formId = useId();
  const inputId = `${formId}-input`;
  const normalizedExpectedValue = expectedValue.trim();
  const isMatch =
    normalizedExpectedValue.length > 0 &&
    confirmationValue.trim() === normalizedExpectedValue;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isMatch || isPending) return;
    await onConfirm(confirmationValue.trim());
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      bodyClassName="grid gap-4"
      footer={
        <>
          <ModalClose
            render={
              <Button variant="outline" disabled={isPending}>
                {cancelLabel}
              </Button>
            }
          />
          <Button
            type="submit"
            form={formId}
            variant="destructive"
            disabled={!isMatch || isPending}
          >
            {isPending ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : null}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-2">
        <Label htmlFor={inputId}>{inputLabel}</Label>
        <Input
          id={inputId}
          value={confirmationValue}
          autoComplete="off"
          dir="auto"
          placeholder={inputPlaceholder}
          onChange={(event) => onConfirmationValueChange(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{inputHint}</p>
      </form>
    </Modal>
  );
}
