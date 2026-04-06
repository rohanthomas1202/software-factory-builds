import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { CreateUserInput, User } from "@/lib/types";

// Initialize store lazily to avoid circular dependencies
let store: any;
async function getStore() {
  if (!store) {
    store = (await import("@/lib/store")).store;
  }
  return store;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return Response.json(
        { error: "Missing required fields: email, password, name" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate password length
    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2) {
      return Response.json(
        { error: "Name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    const storeInstance = await getStore();

    // Check if user already exists
    const existingUser = storeInstance.users.findByEmail(email);
    if (existingUser) {
      return Response.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Create user
    const userInput: CreateUserInput = {
      email,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`,
    };

    const user: User = {
      ...userInput,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
    };

    // Hash password and store separately
    const passwordHash = hashPassword(password);
    storeInstance.users.create(user, passwordHash);

    // Create session
    const { createSession, setSessionCookie } = await import("@/lib/auth");
    const sessionToken = await createSession(user.id);
    await setSessionCookie(sessionToken);

    return Response.json(
      {
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}