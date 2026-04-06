import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  findWorkspaceById,
  findWorkspaceMember,
  findBoardsByWorkspaceId,
  createBoard,
} from '@/lib/store';
import { Board } from '@/lib/types';

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

    const boards = findBoardsByWorkspaceId(workspaceId);

    return new Response(JSON.stringify({ data: boards }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch boards' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Board name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const board = createBoard({
      workspaceId,
      name: name.trim(),
      description: (description || '').trim(),
    });

    return new Response(JSON.stringify({ data: board }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating board:', error);
    return new Response(JSON.stringify({ error: 'Failed to create board' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}