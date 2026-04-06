import { NextResponse } from "next/server";
import { getSessionToken, deleteSession, clearSessionCookie } from "@/lib/auth";

export async function POST(): Promise<Response> {
  try {
    const token = await getSessionToken();
    if (token) {
      deleteSession(token);
    }
    await clearSessionCookie();

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}