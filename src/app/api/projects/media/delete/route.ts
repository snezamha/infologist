import { deleteProjectMediaFileByPublicUrl } from "@/features/media";
import { isActionError } from "@/lib/errors/action-error";

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const publicUrl = url.searchParams.get("publicUrl");
    const projectPublicId = url.searchParams.get("projectPublicId");

    if (!publicUrl) {
      return Response.json(
        { success: false, error: "publicUrl is required" },
        { status: 400 },
      );
    }

    if (!projectPublicId) {
      return Response.json(
        { success: false, error: "projectPublicId is required" },
        { status: 400 },
      );
    }

    const result = await deleteProjectMediaFileByPublicUrl(
      { projectPublicId },
      publicUrl,
    );

    return Response.json(result);
  } catch (error) {
    console.error("Error deleting media:", error);
    const status = isActionError(error)
      ? error.code === "UNAUTHORIZED"
        ? 401
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : 400
      : 500;

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status },
    );
  }
}
