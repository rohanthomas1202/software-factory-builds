import { NextRequest, NextResponse } from "next/server";
import { hashUserPassword, createSession, setSessionCookie } from "@/lib/auth";
import { userStore } from "@/lib/store";
import { User, RegisterRequest } from "@/lib/types";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: RegisterRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.businessName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = userStore
      .getAll()
      .find((user: User) => user.email === body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create new user
    const now = Date.now();
    const user: User = {
      id: crypto.randomUUID(),
      email: body.email,
      passwordHash: hashUserPassword(body.password),
      businessName: body.businessName,
      businessAddress: body.businessAddress || "",
      businessLogo: body.businessLogo || "",
      invoiceNumberPrefix: body.invoiceNumberPrefix || "INV-",
      invoiceNumberCounter: 0,
      currency: body.currency || "USD",
      timezone: body.timezone || "UTC",
      createdAt: now,
      updatedAt: now,
    };

    userStore.create(user);

    // Create session
    const token = await createSession(user.id);
    await setSessionCookie(token);

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json({ data: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}