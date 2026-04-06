import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const boardId = params.boardId;
    const board = store.boards.findById(boardId);
    if (!board) {
      return new Response(
        JSON.stringify({ error: 'Board not found' }),
        { status: 404 }
      );
    }

    // Get project and check workspace membership
    const project = store.projects.findById(board.projectId);
    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404 }
      );
    }

    const members = store.workspaceMembers.findByWorkspaceId(project.workspaceId);
    const userMember = members.find(m => m.userId === user.id);
    if (!userMember) {
      return new Response(
        JSON.stringify({ error: 'Not a workspace member' }),
        { status: 403 }
      );
    }

    // Get all columns for this board, sorted by position
    const columns = store.columns.findByBoardId(boardId);
    columns.sort((a, b) => a.position.localeCompare(b.position));

    // Get all cards for each column
    const columnsWithCards = columns.map(column => {
      const cards = store.cards.findByColumnId(column.id);
      cards.sort((a, b) => a.position.localeCompare(b.position));
      
      return {
        ...column,
        cards,
      };
    });

    return new Response(
      JSON.stringify({ 
        data: { 
          board, 
          project,
          columns: columnsWithCards 
        } 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching board:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}