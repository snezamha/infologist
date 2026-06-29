import { deleteProjectModulePromptTemplates } from "@/lib/projects/project/_db";

export async function deleteModuleTemplates(
  databaseUrl: string,
  moduleKey: string,
): Promise<void> {
  await deleteProjectModulePromptTemplates(databaseUrl, `${moduleKey}/`);
}
