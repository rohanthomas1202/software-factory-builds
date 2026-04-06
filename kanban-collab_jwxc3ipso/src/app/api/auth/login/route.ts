import { NextRequest } from "next/server";

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
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const storeInstance = await getStore();
    const { verifyPassword, createSession, setSessionCookie } = await import("@/lib/auth");

    // Find user by email
    const user = storeInstance.users.findByEmail(email);
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = storeInstance.users.verifyPassword(user.id, password);
    if (!isValidPassword) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSession(user.id);
    await setSessionCookie(sessionToken);

    return Response.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}