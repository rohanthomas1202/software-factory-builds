'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Board } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { toast } = useToast();
  
  const [workspace, setWorkspace] = useState<{ id: string; name: string; description: string } | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceAndBoards();
  }, [workspaceId]);

  const fetchWorkspaceAndBoards = async () => {
    setIsLoading(true);
    try {
      // Fetch workspace
      const workspaceRes = await fetch(`/api/workspaces/${workspaceId}`);
      if (workspaceRes.ok) {
        const workspaceData = await workspaceRes.json();
        setWorkspace(workspaceData.data);
      }

      // Fetch boards
      const boardsRes = await fetch(`/api/workspaces/${workspaceId}/boards`);
      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setBoards(boardsData.data || []);
      }
    } catch (error) {
      toast({ message: 'Failed to load workspace data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) {
      toast({ message: 'Board name is required', type: 'error' });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBoardName.trim(),
          description: newBoardDescription.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create board');
      }

      toast({ message: 'Board created successfully', type: 'success' });
      setNewBoardName('');
      setNewBoardDescription('');
      fetchWorkspaceAndBoards();
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : 'Failed to create board', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board? All columns and cards will be removed.')) {
      return;
    }

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete board');
      }

      toast({ message: 'Board deleted successfully', type: 'success' });
      fetchWorkspaceAndBoards();
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : 'Failed to delete board', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Workspace not found</h1>
            <p className="text-gray-600 mt-2">The workspace you're looking for doesn't exist or you don't have access.</p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-gray-600 mt-2">{workspace.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <Link
              href={`/workspace/${workspaceId}/settings`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Workspace Settings
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Create Board Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Board</h2>
          <form onSubmit={handleCreateBoard} className="space-y-4">
            <div>
              <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-1">
                Board Name *
              </label>
              <input
                type="text"
                id="boardName"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Product Launch"
                required
              />
            </div>
            <div>
              <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="boardDescription"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional board description"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Board'}
            </button>
          </form>
        </div>

        {/* Boards Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Boards</h2>
          {boards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600">No boards yet. Create your first board to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
                      <button
                        onClick={() => handleDeleteBoard(board.id)}
                        className="text-gray-400 hover:text-red-600 text-sm"
                        title="Delete board"
                      >
                        Delete
                      </button>
                    </div>
                    {board.description && (
                      <p className="text-gray-600 text-sm mb-4">{board.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created {new Date(board.createdAt).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/board/${board.id}`}
                      className="block mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-center hover:bg-blue-100"
                    >
                      Open Board
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}