"use client";

import { useCallback, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Eye, Loader2, Pencil, Play, Plus, Trash2 } from "lucide-react";

import { AlignedBadge } from "@/components/ui/aligned-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-base";
import { DashboardFormField } from "@/components/dashboard/form-field";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalClose } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/lib/toast-manager";
import {
  apiCreatePromptTemplate,
  apiDeletePromptTemplate,
  apiGetPromptTemplate,
  apiRunPromptTemplate,
  apiUpdatePromptTemplate,
  type PromptTemplateInputItem,
  type PromptTemplateItem,
  type PromptTemplateListItem,
  type PromptTemplateOutputItem,
  type PromptTemplateType,
} from "@/features/ai-assistant/actions/prompt-templates";

function TypeBadge({ type }: { type: PromptTemplateType }) {
  const t = useTranslations("ai-assistant");
  const variants: Record<
    PromptTemplateType,
    "secondary" | "outline" | "default"
  > = {
    system: "secondary",
    module: "outline",
    user: "default",
  };
  return (
    <AlignedBadge variant={variants[type]}>
      {t(`promptTemplates.types.${type}`)}
    </AlignedBadge>
  );
}

interface Props {
  initialTemplates: PromptTemplateListItem[];
  canManageProtectedTemplates: boolean;
  projectPublicId: string;
}

type FormState = {
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: string;
  inputs: PromptTemplateInputItem[];
  outputs: PromptTemplateOutputItem[];
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  systemPrompt: "",
  userPrompt: "",
  maxTokens: "",
  inputs: [],
  outputs: [],
});

export default function PromptTemplatesClient({
  initialTemplates,
  canManageProtectedTemplates,
  projectPublicId,
}: Props) {
  const t = useTranslations("ai-assistant");

  const [templates, setTemplates] = useState(initialTemplates);
  const [isPending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [runInputs, setRunInputs] = useState<Record<string, string>>({});
  const [runTemplate, setRunTemplate] = useState<PromptTemplateItem | null>(
    null,
  );
  const [runOutput, setRunOutput] = useState<string | null>(null);

  const resetForm = useCallback(() => setForm(emptyForm()), []);

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openView = (id: string) => {
    setActiveId(id);
    setViewOpen(true);
    startTransition(async () => {
      try {
        const tpl = await apiGetPromptTemplate(projectPublicId, id);
        setForm({
          name: tpl.name,
          description: tpl.description,
          systemPrompt: tpl.systemPrompt,
          userPrompt: tpl.userPrompt,
          maxTokens: tpl.maxTokens != null ? String(tpl.maxTokens) : "",
          inputs: tpl.inputs,
          outputs: tpl.outputs,
        });
      } catch {
        toastManager.add({
          title: t("promptTemplates.loadError"),
          type: "error",
          timeout: 4000,
        });
        setViewOpen(false);
      }
    });
  };

  const openEdit = (id: string) => {
    setActiveId(id);
    setEditOpen(true);
    startTransition(async () => {
      try {
        const tpl = await apiGetPromptTemplate(projectPublicId, id);
        setForm({
          name: tpl.name,
          description: tpl.description,
          systemPrompt: tpl.systemPrompt,
          userPrompt: tpl.userPrompt,
          maxTokens: tpl.maxTokens != null ? String(tpl.maxTokens) : "",
          inputs: tpl.inputs,
          outputs: tpl.outputs,
        });
      } catch {
        toastManager.add({
          title: t("promptTemplates.loadError"),
          type: "error",
          timeout: 4000,
        });
        setEditOpen(false);
      }
    });
  };

  const openRun = (id: string) => {
    setActiveId(id);
    setRunOutput(null);
    setRunTemplate(null);
    setRunInputs({});
    setRunOpen(true);
    startTransition(async () => {
      try {
        const tpl = await apiGetPromptTemplate(projectPublicId, id);
        setRunTemplate(tpl);
        const defaults: Record<string, string> = {};
        for (const i of tpl.inputs) defaults[i.key] = "";
        setRunInputs(defaults);
      } catch {
        toastManager.add({
          title: t("promptTemplates.loadError"),
          type: "error",
          timeout: 4000,
        });
        setRunOpen(false);
      }
    });
  };

  const openDelete = (id: string) => {
    setActiveId(id);
    setDeleteOpen(true);
  };

  const handleSave = (mode: "create" | "edit") => {
    const rawTokens = Number(form.maxTokens.trim());
    const parsedMaxTokens =
      form.maxTokens.trim() && Number.isInteger(rawTokens) && rawTokens > 0
        ? rawTokens
        : null;
    const payload = { ...form, maxTokens: parsedMaxTokens };
    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await apiCreatePromptTemplate(
            projectPublicId,
            payload,
          );
          setTemplates((prev) => [
            {
              id: created.id,
              name: created.name,
              description: created.description,
              type: created.type,
              inputCount: created.inputs.length,
              outputCount: created.outputs.length,
              updatedAt: created.updatedAt,
            },
            ...prev,
          ]);
          setCreateOpen(false);
        } else if (activeId) {
          await apiUpdatePromptTemplate(projectPublicId, activeId, payload);
          setTemplates((prev) =>
            prev.map((tpl) =>
              tpl.id === activeId
                ? {
                    ...tpl,
                    name: form.name,
                    description: form.description,
                    inputCount: form.inputs.length,
                    outputCount: form.outputs.length,
                    updatedAt: new Date().toISOString(),
                  }
                : tpl,
            ),
          );
          setEditOpen(false);
        }
        toastManager.add({
          title: t("promptTemplates.saved"),
          type: "success",
          timeout: 3000,
        });
      } catch (err) {
        toastManager.add({
          title:
            err instanceof Error ? err.message : t("promptTemplates.saveError"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  };

  const handleDelete = () => {
    if (!activeId) return;
    startTransition(async () => {
      try {
        await apiDeletePromptTemplate(projectPublicId, activeId);
        setTemplates((prev) => prev.filter((tpl) => tpl.id !== activeId));
        setDeleteOpen(false);
        toastManager.add({
          title: t("promptTemplates.deleted"),
          type: "success",
          timeout: 3000,
        });
      } catch {
        toastManager.add({
          title: t("promptTemplates.deleteError"),
          type: "error",
          timeout: 4000,
        });
      }
    });
  };

  const handleRun = () => {
    if (!activeId) return;
    setRunOutput(null);
    startTransition(async () => {
      try {
        const result = await apiRunPromptTemplate(
          projectPublicId,
          activeId,
          runInputs,
        );
        setRunOutput(result.output);
      } catch (err) {
        toastManager.add({
          title:
            err instanceof Error ? err.message : t("promptTemplates.runError"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  };

  const addInput = () =>
    setForm((prev) => ({
      ...prev,
      inputs: [
        ...prev.inputs,
        {
          key: "",
          label: "",
          description: "",
          required: true,
          order: prev.inputs.length,
        },
      ],
    }));

  const updateInput = (
    idx: number,
    field: keyof PromptTemplateInputItem,
    value: string | boolean,
  ) =>
    setForm((prev) => {
      const inputs = [...prev.inputs];
      inputs[idx] = { ...inputs[idx], [field]: value };
      return { ...prev, inputs };
    });

  const removeInput = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      inputs: prev.inputs
        .filter((_, i) => i !== idx)
        .map((inp, i) => ({ ...inp, order: i })),
    }));

  const addOutput = () =>
    setForm((prev) => ({
      ...prev,
      outputs: [
        ...prev.outputs,
        { key: "", label: "", description: "", order: prev.outputs.length },
      ],
    }));

  const updateOutput = (
    idx: number,
    field: keyof PromptTemplateOutputItem,
    value: string,
  ) =>
    setForm((prev) => {
      const outputs = [...prev.outputs];
      outputs[idx] = { ...outputs[idx], [field]: value };
      return { ...prev, outputs };
    });

  const removeOutput = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      outputs: prev.outputs
        .filter((_, i) => i !== idx)
        .map((out, i) => ({ ...out, order: i })),
    }));

  const columns: ColumnDef<PromptTemplateListItem>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("promptTemplates.columns.name")}
        />
      ),
      cell: ({ row }) => (
        <span dir="auto" className="font-medium">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("promptTemplates.columns.description")}
        />
      ),
      cell: ({ row }) => (
        <span dir="auto" className="text-muted-foreground line-clamp-1 text-sm">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("promptTemplates.columns.type")}
        />
      ),
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "inputCount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("promptTemplates.columns.inputs")}
        />
      ),
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground text-sm">
          {row.original.inputCount}
        </span>
      ),
    },
    {
      accessorKey: "outputCount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("promptTemplates.columns.outputs")}
        />
      ),
      cell: ({ row }) => (
        <span dir="ltr" className="text-muted-foreground text-sm">
          {row.original.outputCount}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{t("promptTemplates.actions")}</span>
      ),
      cell: ({ row }) => {
        const isViewOnly =
          !canManageProtectedTemplates && row.original.type !== "user";
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={() => openRun(row.original.id)}
              title={t("promptTemplates.runLabel")}
            >
              <Play className="size-4" />
            </Button>
            {isViewOnly ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => openView(row.original.id)}
                title={t("promptTemplates.view")}
              >
                <Eye className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => openEdit(row.original.id)}
                  title={t("promptTemplates.edit")}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => openDelete(row.original.id)}
                  title={t("promptTemplates.delete")}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const formModal = (
    mode: "create" | "edit",
    open: boolean,
    onOpenChange: (v: boolean) => void,
  ) => (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        mode === "create"
          ? "promptTemplates.createTitle"
          : "promptTemplates.editTitle",
      )}
      contentClassName="sm:max-w-2xl grid-rows-[auto_auto_auto] overflow-y-auto"
      bodyClassName="!overflow-y-visible"
      footer={
        <>
          <ModalClose
            render={
              <Button variant="outline">{t("promptTemplates.cancel")}</Button>
            }
          />
          <Button onClick={() => handleSave(mode)} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("promptTemplates.save")}
          </Button>
        </>
      }
    >
      <TemplateForm
        form={form}
        onAddInput={addInput}
        onUpdateInput={updateInput}
        onRemoveInput={removeInput}
        onAddOutput={addOutput}
        onUpdateOutput={updateOutput}
        onRemoveOutput={removeOutput}
        onChange={setForm}
      />
    </Modal>
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("promptTemplates.title")}
        description={t("promptTemplates.description")}
        meta={t("promptTemplates.templateCount", { count: templates.length })}
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            {t("promptTemplates.newTemplate")}
          </Button>
        }
      />

      <ClientDataTable
        columns={columns}
        data={templates}
        searchPlaceholder={t("promptTemplates.search")}
        searchKeys={["name", "description"]}
        noDataMessage={t("promptTemplates.empty")}
      />

      {formModal("create", createOpen, setCreateOpen)}
      {formModal("edit", editOpen, setEditOpen)}

      <Modal
        open={viewOpen}
        onOpenChange={setViewOpen}
        title={t("promptTemplates.viewTitle")}
        contentClassName="sm:max-w-2xl grid-rows-[auto_auto_auto] overflow-y-auto"
        bodyClassName="!overflow-y-visible"
        footer={
          <ModalClose
            render={
              <Button variant="outline">{t("promptTemplates.cancel")}</Button>
            }
          />
        }
      >
        <TemplateForm
          form={form}
          readOnly
          onAddInput={() => {}}
          onUpdateInput={() => {}}
          onRemoveInput={() => {}}
          onAddOutput={() => {}}
          onUpdateOutput={() => {}}
          onRemoveOutput={() => {}}
          onChange={() => {}}
        />
      </Modal>

      <Modal
        open={runOpen}
        onOpenChange={(open) => {
          setRunOpen(open);
          if (!open) setRunOutput(null);
        }}
        title={t("promptTemplates.runTitle")}
        description={runTemplate?.name}
        contentClassName="sm:max-w-xl grid-rows-[auto_auto_auto] overflow-y-auto"
        bodyClassName="!overflow-y-visible"
        footer={
          <>
            <ModalClose
              render={
                <Button variant="outline">{t("promptTemplates.cancel")}</Button>
              }
            />
            <Button onClick={handleRun} disabled={isPending || !runTemplate}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {isPending
                ? t("promptTemplates.run.running")
                : t("promptTemplates.run.run")}
            </Button>
          </>
        }
      >
        {runTemplate && (
          <div className="space-y-4">
            {runTemplate.inputs.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("promptTemplates.run.noInputs")}
              </p>
            ) : (
              runTemplate.inputs.map((inp) => (
                <DashboardFormField
                  key={inp.key}
                  id={`run-${inp.key}`}
                  label={
                    <>
                      {inp.label}
                      {inp.required && (
                        <span className="text-destructive ms-0.5">*</span>
                      )}
                    </>
                  }
                >
                  <Textarea
                    id={`run-${inp.key}`}
                    rows={3}
                    dir="auto"
                    value={runInputs[inp.key] ?? ""}
                    onChange={(e) =>
                      setRunInputs((prev) => ({
                        ...prev,
                        [inp.key]: e.target.value,
                      }))
                    }
                  />
                </DashboardFormField>
              ))
            )}
            {runOutput !== null && (
              <DashboardFormField
                id="run-output"
                label={t("promptTemplates.run.output")}
              >
                <div className="bg-muted/50 rounded-lg border p-3">
                  <pre
                    dir="auto"
                    className="whitespace-pre-wrap break-words text-sm"
                  >
                    {runOutput}
                  </pre>
                </div>
              </DashboardFormField>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("promptTemplates.deleteTitle")}
        description={t("promptTemplates.deleteDescription")}
        footer={
          <>
            <ModalClose
              render={
                <Button variant="outline">{t("promptTemplates.cancel")}</Button>
              }
            />
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {t("promptTemplates.delete")}
            </Button>
          </>
        }
      />
    </div>
  );
}

type TemplateFormProps = {
  form: FormState;
  readOnly?: boolean;
  onChange: React.Dispatch<React.SetStateAction<FormState>>;
  onAddInput: () => void;
  onUpdateInput: (
    i: number,
    f: keyof PromptTemplateInputItem,
    v: string | boolean,
  ) => void;
  onRemoveInput: (i: number) => void;
  onAddOutput: () => void;
  onUpdateOutput: (
    i: number,
    f: keyof PromptTemplateOutputItem,
    v: string,
  ) => void;
  onRemoveOutput: (i: number) => void;
};

function TemplateForm({
  form,
  readOnly = false,
  onChange,
  onAddInput,
  onUpdateInput,
  onRemoveInput,
  onAddOutput,
  onUpdateOutput,
  onRemoveOutput,
}: TemplateFormProps) {
  const t = useTranslations("ai-assistant");
  const set = (field: keyof FormState, value: string) =>
    onChange((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardFormField
          id="tpl-name"
          label={
            readOnly ? (
              t("promptTemplates.form.name")
            ) : (
              <>
                {t("promptTemplates.form.name")}
                <span className="text-destructive ms-0.5">*</span>
              </>
            )
          }
        >
          <Input
            id="tpl-name"
            dir="auto"
            readOnly={readOnly}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </DashboardFormField>
        <DashboardFormField
          id="tpl-desc"
          label={t("promptTemplates.form.description")}
        >
          <Input
            id="tpl-desc"
            dir="auto"
            readOnly={readOnly}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </DashboardFormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardFormField
          id="tpl-max-tokens"
          label={t("promptTemplates.form.maxTokens")}
        >
          <Input
            id="tpl-max-tokens"
            dir="ltr"
            type="number"
            min={1}
            max={128000}
            readOnly={readOnly}
            placeholder={t("promptTemplates.form.maxTokensHint")}
            value={form.maxTokens}
            onChange={(e) => set("maxTokens", e.target.value)}
          />
        </DashboardFormField>
      </div>

      <DashboardFormField
        id="tpl-system"
        label={t("promptTemplates.form.systemPrompt")}
      >
        <Textarea
          id="tpl-system"
          rows={3}
          dir="auto"
          readOnly={readOnly}
          value={form.systemPrompt}
          onChange={(e) => set("systemPrompt", e.target.value)}
        />
      </DashboardFormField>

      <DashboardFormField
        id="tpl-user"
        label={
          readOnly ? (
            t("promptTemplates.form.userPrompt")
          ) : (
            <>
              {t("promptTemplates.form.userPrompt")}
              <span className="text-destructive ms-0.5">*</span>
            </>
          )
        }
      >
        <Textarea
          id="tpl-user"
          rows={4}
          dir="auto"
          readOnly={readOnly}
          value={form.userPrompt}
          onChange={(e) => set("userPrompt", e.target.value)}
        />
      </DashboardFormField>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {t("promptTemplates.form.inputs")}
          </Label>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAddInput}
            >
              <Plus className="size-3.5" />
              {t("promptTemplates.form.addInput")}
            </Button>
          )}
        </div>
        {form.inputs.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            {t("promptTemplates.form.noInputs")}
          </p>
        ) : (
          <div className="space-y-2">
            {form.inputs.map((inp, idx) => (
              <div
                key={idx}
                className="bg-muted/40 grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-lg border p-3"
              >
                <DashboardFormField
                  id={`inp-key-${idx}`}
                  label={
                    readOnly ? (
                      t("promptTemplates.form.inputKey")
                    ) : (
                      <>
                        {t("promptTemplates.form.inputKey")}
                        <span className="text-destructive ms-0.5">*</span>
                      </>
                    )
                  }
                >
                  <Input
                    id={`inp-key-${idx}`}
                    dir="ltr"
                    readOnly={readOnly}
                    value={inp.key}
                    onChange={(e) => onUpdateInput(idx, "key", e.target.value)}
                  />
                </DashboardFormField>
                <DashboardFormField
                  id={`inp-label-${idx}`}
                  label={
                    readOnly ? (
                      t("promptTemplates.form.inputLabel")
                    ) : (
                      <>
                        {t("promptTemplates.form.inputLabel")}
                        <span className="text-destructive ms-0.5">*</span>
                      </>
                    )
                  }
                >
                  <Input
                    id={`inp-label-${idx}`}
                    dir="auto"
                    readOnly={readOnly}
                    value={inp.label}
                    onChange={(e) =>
                      onUpdateInput(idx, "label", e.target.value)
                    }
                  />
                </DashboardFormField>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemoveInput(idx)}
                    className="mb-0.5"
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                )}
                <div
                  className={
                    readOnly
                      ? "col-span-2 flex items-center gap-2"
                      : "col-span-3 flex items-center gap-2"
                  }
                >
                  <Checkbox
                    id={`inp-req-${idx}`}
                    checked={inp.required}
                    disabled={readOnly}
                    onCheckedChange={(v) =>
                      onUpdateInput(idx, "required", v === true)
                    }
                  />
                  <Label
                    htmlFor={`inp-req-${idx}`}
                    className="text-sm font-normal"
                  >
                    {t("promptTemplates.form.required")}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {t("promptTemplates.form.outputs")}
          </Label>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAddOutput}
            >
              <Plus className="size-3.5" />
              {t("promptTemplates.form.addOutput")}
            </Button>
          )}
        </div>
        {form.outputs.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            {t("promptTemplates.form.noOutputs")}
          </p>
        ) : (
          <div className="space-y-2">
            {form.outputs.map((out, idx) => (
              <div
                key={idx}
                className="bg-muted/40 grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-lg border p-3"
              >
                <DashboardFormField
                  id={`out-key-${idx}`}
                  label={
                    readOnly ? (
                      t("promptTemplates.form.outputKey")
                    ) : (
                      <>
                        {t("promptTemplates.form.outputKey")}
                        <span className="text-destructive ms-0.5">*</span>
                      </>
                    )
                  }
                >
                  <Input
                    id={`out-key-${idx}`}
                    dir="ltr"
                    readOnly={readOnly}
                    value={out.key}
                    onChange={(e) => onUpdateOutput(idx, "key", e.target.value)}
                  />
                </DashboardFormField>
                <DashboardFormField
                  id={`out-label-${idx}`}
                  label={
                    readOnly ? (
                      t("promptTemplates.form.outputLabel")
                    ) : (
                      <>
                        {t("promptTemplates.form.outputLabel")}
                        <span className="text-destructive ms-0.5">*</span>
                      </>
                    )
                  }
                >
                  <Input
                    id={`out-label-${idx}`}
                    dir="auto"
                    readOnly={readOnly}
                    value={out.label}
                    onChange={(e) =>
                      onUpdateOutput(idx, "label", e.target.value)
                    }
                  />
                </DashboardFormField>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemoveOutput(idx)}
                    className="mb-0.5"
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
