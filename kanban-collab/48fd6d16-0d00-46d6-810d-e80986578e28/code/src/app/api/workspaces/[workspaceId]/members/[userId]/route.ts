import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

interface RouteParams {
  params: {
    workspaceId: string;
    userId: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, userId } = params;

    // Check if workspace exists
    const workspace = store.workspaces.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if current user is the workspace owner
    if (workspace.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Only the workspace owner can remove members' }, { status: 403 });
    }

    // Check if user is trying to remove themselves
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot remove yourself as owner. Transfer ownership first.' }, { status: 400 });
    }

    // Find the member
    const member = store.workspaceMembers.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found in workspace' }, { status: 404 });
    }

    // Remove the member
    store.workspaceMembers.delete(member.id);

    return NextResponse.json({ 
      data: { 
        success: true,
        message: 'Member removed successfully' 
      } 
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}