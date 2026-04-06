import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  findWorkspaceById,
  findWorkspaceMember,
  findWorkspaceMembersByWorkspaceId,
  updateWorkspace,
  deleteWorkspace,
} from '@/lib/store';
import { Workspace } from '@/lib/types';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { workspaceId } = await params;
    const workspace = findWorkspaceById(workspaceId);

    if (!workspace) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is a member
    const member = findWorkspaceMember(workspaceId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const members = findWorkspaceMembersByWorkspaceId(workspaceId);

    return new Response(
      JSON.stringify({
        data: {
          ...workspace,
          members,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { workspaceId } = await params;
    const workspace = findWorkspaceById(workspaceId);

    if (!workspace) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is an owner
    const member = findWorkspaceMember(workspaceId, user.id);
    if (!member || member.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only owners can update workspace' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, description } = body;

    const updates: Partial<Workspace> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid workspace name' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = (description || '').trim();
    }

    const updatedWorkspace = updateWorkspace(workspaceId, updates);
    if (!updatedWorkspace) {
      return new Response(JSON.stringify({ error: 'Failed to update workspace' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: updatedWorkspace }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to update workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { workspaceId } = await params;
    const workspace = findWorkspaceById(workspaceId);

    if (!workspace) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is an owner
    const member = findWorkspaceMember(workspaceId, user.id);
    if (!member || member.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Only owners can delete workspace' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const success = deleteWorkspace(workspaceId);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete workspace' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: { success: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}