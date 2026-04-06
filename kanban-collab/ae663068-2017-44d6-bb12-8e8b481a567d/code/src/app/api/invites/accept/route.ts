import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  validateInviteToken,
  getCurrentUser,
} from '@/lib/auth';
import {
  findInviteByToken,
  updateInvite,
  createWorkspaceMember,
  findUserByEmail,
  createUser,
} from '@/lib/store';
import { createAndSendNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Validate token
    const invite = validateInviteToken(token);
    if (!invite) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Check if invite exists and is not expired
    const storedInvite = findInviteByToken(token);
    if (!storedInvite || storedInvite.acceptedAt) {
      return Response.json({ error: 'Invite already used or not found' }, { status: 400 });
    }

    if (storedInvite.expiresAt < Date.now()) {
      return Response.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Check if user exists
    let user = findUserByEmail(storedInvite.email);
    let isNewUser = false;

    if (user) {
      // Existing user: check if already a member
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session')?.value;
      
      if (!sessionToken) {
        return Response.json(
          { error: 'Please log in to accept the invite' },
          { status: 401 }
        );
      }

      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.id !== user.id) {
        return Response.json(
          { error: 'You must be logged in as the invited user' },
          { status: 403 }
        );
      }
    } else {
      // New user: create account
      if (!name || !password) {
        return Response.json(
          { error: 'Name and password are required for new users' },
          { status: 400 }
        );
      }

      user = createUser({
        email: storedInvite.email,
        password, // Note: In production, hash this password
        name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${storedInvite.email}`,
        emailVerified: true, // Auto-verify since they're accepting an invite
      });
      isNewUser = true;
    }

    // Create workspace member
    const member = createWorkspaceMember({
      workspaceId: storedInvite.workspaceId,
      userId: user.id,
      role: storedInvite.role,
    });

    // Mark invite as accepted
    updateInvite(storedInvite.id, {
      acceptedAt: Date.now(),
    });

    // Create notification for the inviter
    createAndSendNotification({
      userId: storedInvite.invitedBy,
      type: 'invite',
      title: 'Invite Accepted',
      message: `${user.name || user.email} has accepted your invitation to join the workspace.`,
      link: `/workspace/${storedInvite.workspaceId}`,
      read: false,
    });

    return Response.json({
      data: {
        user: isNewUser ? user : undefined,
        workspaceId: storedInvite.workspaceId,
        member,
        invite: { ...storedInvite, acceptedAt: Date.now() },
      },
    });
  } catch (error) {
    console.error('Failed to accept invite:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}