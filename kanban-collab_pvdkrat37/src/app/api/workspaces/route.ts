import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createWorkspace, createWorkspaceMember, findWorkspacesByUserId } from '@/lib/store';
import { Workspace } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Workspace name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const workspace = createWorkspace({
      name: name.trim(),
      description: (description || '').trim(),
    });

    // Make the creator an owner
    createWorkspaceMember({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });

    return new Response(JSON.stringify({ data: workspace }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to create workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const workspaces = findWorkspacesByUserId(user.id);

    return new Response(JSON.stringify({ data: workspaces }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch workspaces' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}