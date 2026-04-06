import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to accept an invite' },
        { status: 401 }
      );
    }

    const invite = store.invites.findByToken(token);
    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or has expired' },
        { status: 404 }
      );
    }

    if (invite.expiresAt < Date.now()) {
      store.invites.delete(invite.id);
      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      );
    }

    if (invite.email !== user.email) {
      return NextResponse.json(
        { error: 'This invite is for a different email address' },
        { status: 403 }
      );
    }

    const workspace = store.workspaces.findById(invite.workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace no longer exists' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = store.workspaceMembers
      .findByWorkspaceId(invite.workspaceId)
      .find(member => member.userId === user.id);

    if (existingMember) {
      store.invites.delete(invite.id);
      return NextResponse.json(
        { error: 'You are already a member of this workspace' },
        { status: 400 }
      );
    }

    // Add user as workspace member
    const member = {
      id: crypto.randomUUID(),
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: invite.role,
      joinedAt: Date.now(),
    };

    store.workspaceMembers.create(member);
    store.invites.delete(invite.id);

    return NextResponse.json({
      data: {
        workspace,
        member,
      },
    });
  } catch (error) {
    console.error('Failed to accept invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}