"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DashboardFormField } from "./form-field";

type Props<T extends string> = {
  id: string;
  label: string;
  description?: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  getLabel?: (value: T) => string;
  className?: string;
  triggerClassName?: string;
};

export function DashboardSelectField<T extends string>({
  id,
  label,
  description,
  value,
  options,
  onChange,
  getLabel = (option) => option,
  className,
  triggerClassName = "w-full sm:w-64",
}: Props<T>) {
  return (
    <DashboardFormField
      id={id}
      label={label}
      description={description}
      className={className}
    >
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as T)}
      >
        <SelectTrigger id={id} className={triggerClassName}>
          <SelectValue>{getLabel(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {getLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DashboardFormField>
  );
}
