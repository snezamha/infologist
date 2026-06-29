import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const publicUrl = url.searchParams.get("url");

    if (!publicUrl) {
      return Response.json(
        { error: "url parameter is required" },
        { status: 400 },
      );
    }

    // Ensure the URL is a valid public path (starts with /)
    if (!publicUrl.startsWith("/")) {
      return Response.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Prevent directory traversal attacks
    if (publicUrl.includes("..")) {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Resolve the file path from the public directory
    const filePath = join(process.cwd(), "public", publicUrl);
    const buffer = await readFile(filePath);

    // Determine content type from file extension
    const ext = publicUrl.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "gif") contentType = "image/gif";
    else if (ext === "webp") contentType = "image/webp";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching resume media:", error);

    if (error instanceof Error && error.message.includes("ENOENT")) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    return Response.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}
