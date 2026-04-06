import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  findInviteById,
  deleteInvite,
  findWorkspaceById,
  findWorkspaceMember,
} from '@/lib/store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; inviteId: string }> }
) {
  try {
    const { workspaceId, inviteId } = await params;
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
        { error: 'Only workspace owners can delete invites' },
        { status: 403 }
      );
    }

    const invite = findInviteById(inviteId);
    if (!invite || invite.workspaceId !== workspaceId) {
      return Response.json({ error: 'Invite not found' }, { status: 404 });
    }

    const deleted = deleteInvite(inviteId);
    if (!deleted) {
      return Response.json({ error: 'Failed to delete invite' }, { status: 500 });
    }

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete invite:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}