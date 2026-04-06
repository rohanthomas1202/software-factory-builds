import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { CreateInviteInput, WorkspaceInvite, Role } from '@/lib/types';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workspace = store.workspaces.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Only workspace owner can invite
    if (workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only workspace owner can invite members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const input: CreateInviteInput = {
      workspaceId,
      email: body.email.toLowerCase().trim(),
      role: (body.role as Role) || 'member',
      invitedBy: user.id,
    };

    if (!input.email || !input.email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = store.workspaceMembers
      .findByWorkspaceId(workspaceId)
      .find(member => {
        const user = store.users.findById(member.userId);
        return user?.email === input.email;
      });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      );
    }

    // Check for existing invite
    const existingInvite = store.invites
      .findByWorkspaceId(workspaceId)
      .find(invite => invite.email === input.email);

    if (existingInvite) {
      if (existingInvite.expiresAt > Date.now()) {
        return NextResponse.json(
          { error: 'Invite already sent to this email' },
          { status: 400 }
        );
      }
      // Remove expired invite
      store.invites.delete(existingInvite.id);
    }

    const invite: WorkspaceInvite = {
      ...input,
      id: crypto.randomUUID(),
      token: crypto.randomUUID().replace(/-/g, ''),
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    store.invites.create(invite);

    return NextResponse.json(
      { data: invite },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workspace = store.workspaces.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Only workspace members can see invites
    const isMember = store.workspaceMembers
      .findByWorkspaceId(workspaceId)
      .some(member => member.userId === user.id);

    if (!isMember) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const invites = store.invites.findByWorkspaceId(workspaceId);

    return NextResponse.json({ data: invites });
  } catch (error) {
    console.error('Failed to fetch invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}