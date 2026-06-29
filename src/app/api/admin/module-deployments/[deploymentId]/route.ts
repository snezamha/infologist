import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/rbac";
import { getModuleDeployment } from "@/lib/module-deployments/store";

type Context = { params: Promise<{ deploymentId: string }> };

export async function GET(_request: Request, context: Context) {
  await requireSuperAdmin();
  const { deploymentId } = await context.params;
  const deployment = await getModuleDeployment(deploymentId);
  if (!deployment) {
    return NextResponse.json(
      { error: "Deployment not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(deployment, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
