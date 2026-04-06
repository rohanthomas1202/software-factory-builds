import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { deleteSession } = await import("@/lib/auth");
    await deleteSession();

    // Clear session cookie
    const response = Response.json({ data: { success: true } });
    response.headers.set(
      "Set-Cookie",
      "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}