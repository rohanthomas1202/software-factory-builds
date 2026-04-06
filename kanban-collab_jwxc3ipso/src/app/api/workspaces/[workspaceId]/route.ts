import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Workspace, WorkspaceMember, Project, User } from '@/lib/types';

interface RouteParams {
  params: {
    workspaceId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { workspaceId } = await params;
    const workspace = store.workspaces.findById(workspaceId);
    
    if (!workspace) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is a member of this workspace
    const membership = store.workspaceMembers.findByWorkspaceId(workspaceId)
      .find(member => member.userId === currentUser.id);
    
    if (!membership) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all members with their user details
    const members = store.workspaceMembers.findByWorkspaceId(workspaceId);
    const membersWithDetails = members.map(member => {
      const user = store.users.findById(member.userId);
      return {
        ...member,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        } : null,
      };
    });

    // Get all projects in this workspace
    const projects = store.projects.findByWorkspaceId(workspaceId);

    const response = {
      workspace,
      members: membersWithDetails,
      projects,
    };

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}