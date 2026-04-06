import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  getCurrentUser,
  createInviteToken,
  validateInviteToken,
} from '@/lib/auth';
import {
  createInvite,
  findInvitesByWorkspaceId,
  findWorkspaceById,
  findWorkspaceMember,
  findUserByEmail,
} from '@/lib/store';
import { sendInviteEmail } from '@/lib/notifications';
import { generateId } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = findWorkspaceById(workspaceId);
    if (!workspace) {
      return Response.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = findWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return Response.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    const invites = findInvitesByWorkspaceId(workspaceId);
    return Response.json({ data: invites });
  } catch (error) {
    console.error('Failed to fetch invites:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = findWorkspaceById(workspaceId);
    if (!workspace) {
      return Response.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = findWorkspaceMember(workspaceId, user.id);
    if (!member || member.role !== 'owner') {
      return Response.json(
        { error: 'Only workspace owners can send invites' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = 'member' } = body;

    if (!email || typeof email !== 'string') {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      const existingMember = findWorkspaceMember(workspaceId, existingUser.id);
      if (existingMember) {
        return Response.json(
          { error: 'User is already a member of this workspace' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invite
    const existingInvites = findInvitesByWorkspaceId(workspaceId);
    const existingInvite = existingInvites.find(
      (invite) => invite.email === email && !invite.acceptedAt
    );
    if (existingInvite) {
      return Response.json(
        { error: 'Invite already sent to this email' },
        { status: 400 }
      );
    }

    const token = createInviteToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invite = createInvite({
      workspaceId,
      email,
      role: role as 'owner' | 'member',
      invitedBy: user.id,
      token,
      expiresAt,
      acceptedAt: null,
    });

    // Send invite email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;
    sendInviteEmail(email, workspace.name, user.name || user.email, inviteUrl);

    return Response.json({ data: invite }, { status: 201 });
  } catch (error) {
    console.error('Failed to create invite:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}