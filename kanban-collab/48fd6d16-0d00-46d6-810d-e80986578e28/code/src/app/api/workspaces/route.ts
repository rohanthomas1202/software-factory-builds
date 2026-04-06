import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { CreateWorkspaceInput, Workspace } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: CreateWorkspaceInput = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Workspace name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ownerId: currentUser.id,
      createdAt: Date.now(),
    };

    store.workspaces.create(workspace);
    
    // Add the creator as the owner member
    store.workspaceMembers.create({
      id: crypto.randomUUID(),
      workspaceId: workspace.id,
      userId: currentUser.id,
      role: 'owner',
      joinedAt: Date.now(),
    });

    return new Response(JSON.stringify({ data: workspace }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all workspaces where the user is a member
    const userMemberships = store.workspaceMembers.findByUserId(currentUser.id);
    const workspaces = userMemberships.map(member => 
      store.workspaces.findById(member.workspaceId)
    ).filter(Boolean) as Workspace[];

    return new Response(JSON.stringify({ data: workspaces }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}