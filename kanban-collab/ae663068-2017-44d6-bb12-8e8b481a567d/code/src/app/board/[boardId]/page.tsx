"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KanbanBoard from "@/components/KanbanBoard";
import { getCurrentUser } from "@/lib/auth";
import useBoard from "@/hooks/useBoard";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const [boardId, setBoardId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { board, columns, cards, refresh, loading: boardLoading } = useBoard(boardId);

  useEffect(() => {
    async function init() {
      try {
        const resolvedParams = await params;
        setBoardId(resolvedParams.boardId);
        
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setCurrentUser(user);
      } catch (err) {
        setError("Failed to load board data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!board && !boardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-4 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Board Not Found</h2>
          <p className="text-gray-600 mb-6">The board you're looking for doesn't exist or you don't have access.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {board?.name || "Loading..."}
              </h1>
              {board?.description && (
                <p className="text-sm text-gray-600 mt-1">{board.description}</p>
              )}
            </div>
          </div>
          {board && (
            <Link
              href={`/workspace/${board.workspaceId}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Workspace
            </Link>
          )}
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-[1800px] mx-auto">
          {boardLoading && !board ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading board data...</p>
              </div>
            </div>
          ) : (
            <KanbanBoard
              initialColumns={columns}
              initialCards={cards}
              boardId={boardId}
              currentUserId={currentUser?.id}
            />
          )}
        </div>
      </main>
    </div>
  );
}