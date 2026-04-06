import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { CreateProjectInput, CreateBoardInput } from '@/lib/types';
import { LexoRank } from '@/lib/lexorank';

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const workspaceId = params.workspaceId;
    const workspace = store.workspaces.findById(workspaceId);
    if (!workspace) {
      return new Response(
        JSON.stringify({ error: 'Workspace not found' }),
        { status: 404 }
      );
    }

    // Check if user is a member of the workspace
    const members = store.workspaceMembers.findByWorkspaceId(workspaceId);
    const userMember = members.find(m => m.userId === user.id);
    if (!userMember) {
      return new Response(
        JSON.stringify({ error: 'Not a workspace member' }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Project name is required' }),
        { status: 400 }
      );
    }

    // Create project
    const projectInput: CreateProjectInput = {
      workspaceId,
      name: name.trim(),
      description: (description || '').trim(),
    };

    const project = store.projects.create(projectInput);

    // Create first board for the project
    const boardInput: CreateBoardInput = {
      projectId: project.id,
      name: 'Main Board',
    };
    const board = store.boards.create(boardInput);

    // Create default columns for the board
    const defaultColumns = [
      { name: 'Backlog', position: LexoRank.middle().toString() },
      { name: 'To Do', position: LexoRank.middle().next().toString() },
      { name: 'In Progress', position: LexoRank.middle().next().next().toString() },
      { name: 'Done', position: LexoRank.middle().next().next().next().toString() },
    ];

    const columns = defaultColumns.map(col => {
      return store.columns.create({
        boardId: board.id,
        name: col.name,
        position: col.position,
      });
    });

    return new Response(
      JSON.stringify({ 
        data: { 
          project, 
          board, 
          columns 
        } 
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const workspaceId = params.workspaceId;
    
    // Check if user is a member of the workspace
    const members = store.workspaceMembers.findByWorkspaceId(workspaceId);
    const userMember = members.find(m => m.userId === user.id);
    if (!userMember) {
      return new Response(
        JSON.stringify({ error: 'Not a workspace member' }),
        { status: 403 }
      );
    }

    // Get all projects for the workspace
    const projects = store.projects.findByWorkspaceId(workspaceId);

    // For each project, get its boards
    const projectsWithBoards = projects.map(project => {
      const boards = store.boards.findByProjectId(project.id);
      return {
        ...project,
        boards,
      };
    });

    return new Response(
      JSON.stringify({ data: projectsWithBoards }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}