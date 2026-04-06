import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import BoardView from '@/components/BoardView';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

interface BoardPageProps {
  params: {
    workspaceId: string;
    boardId: string;
  };
}

export async function generateMetadata({ params }: BoardPageProps): Promise<Metadata> {
  const board = store.boards.findById(params.boardId);
  return {
    title: board ? `${board.name} - Kanban Board` : 'Board not found',
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { workspaceId, boardId } = params;
  
  // Check workspace existence and user membership
  const workspace = store.workspaces.findById(workspaceId);
  if (!workspace) {
    notFound();
  }

  const members = store.workspaceMembers.findByWorkspaceId(workspaceId);
  const userMember = members.find(m => m.userId === user.id);
  if (!userMember) {
    redirect(`/workspace/${workspaceId}`);
  }

  // Fetch board data
  const board = store.boards.findById(boardId);
  if (!board) {
    notFound();
  }

  // Verify board belongs to workspace via project
  const project = store.projects.findById(board.projectId);
  if (!project || project.workspaceId !== workspaceId) {
    notFound();
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

  return (
    <div className="h-screen flex flex-col">
      <BoardView
        initialBoard={board}
        initialProject={project}
        initialColumns={columnsWithCards}
        workspaceId={workspaceId}
      />
    </div>
  );
}