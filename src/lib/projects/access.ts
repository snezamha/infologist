import { hasPermission, isSuperAdmin, requireSession } from "@/lib/auth/rbac";
import { ActionError } from "@/lib/errors/action-error";
import { getPrisma } from "@/lib/prisma";
import type { Role } from "@/lib/users/role";

async function ownsProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const project = await getPrisma().project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  return Boolean(project) && project?.ownerId === userId;
}

export async function requireProjectManageAccess(projectId: string) {
  const session = await requireSession();
  const role = session.user.role as Role;

  if (isSuperAdmin(role)) return session;

  if (
    !hasPermission(role, "projects.manage") ||
    !(await ownsProject(session.user.id, projectId))
  ) {
    throw new ActionError(
      "FORBIDDEN",
      "You do not have access to this project",
    );
  }

  return session;
}
