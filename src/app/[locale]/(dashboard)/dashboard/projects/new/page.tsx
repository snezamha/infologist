import { redirect } from "next/navigation";
import { getRequestLocale } from "@/i18n/locale";

export default async function NewProjectPage() {
  const locale = await getRequestLocale();
  redirect(`/${locale}/dashboard/projects`);
}
