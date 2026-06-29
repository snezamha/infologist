import { z } from "zod";

import { roles } from "@/lib/users/role-values";

export const userEditorSchema = z.object({
  name: z.string().trim().max(120),
  email: z.string().trim().email().max(320),
  role: z.enum(roles),
});

export const userListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  query: z.string().trim().max(200).default(""),
});
