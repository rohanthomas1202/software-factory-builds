"use client";

import { useState, useEffect, useCallback } from "react";
import { XMarkIcon, UserIcon, CalendarIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Card, Priority, User } from "@/lib/types";
import { useBoardSocket } from "@/hooks/useBoardSocket";

interface CardModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

type UpdateField = {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  dueDate?: number | null;
  priority?: Priority;
  columnId?: string;
};

export default function CardModal({
  cardId,
  isOpen,
  onClose,
  workspaceId,
}: CardModalProps) {
  const [card, setCard] = useState<Card | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveQueue, setSaveQueue] = useState<UpdateField>({});
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCard = useCallback(async () => {
    try {
      const response = await fetch(`/api/cards/${cardId}`);
      if (!response.ok) throw new Error("Failed to fetch card");
      const { data } = await response.json();
      setCard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card");
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) throw new Error("Failed to fetch members");
      const { data } = await response.json();
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      fetchCard();
      fetchMembers();
    }
  }, [isOpen, fetchCard, fetchMembers]);

  useBoardSocket({
    boardId: card?.boardId || "",
    onCardUpdated: (updatedCard) => {
      if (updatedCard.id === cardId) {
        setCard(updatedCard);
      }
    },
  });

  const debouncedSave = useCallback((updates: UpdateField) => {
    setSaveQueue(prev => ({ ...prev, ...updates }));
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (Object.keys(saveQueue).length === 0) return;

      setIsSaving(true);
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveQueue),
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Failed to save");
        }

        const { data } = await response.json();
        setCard(data);
        setSaveQueue({});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [cardId, saveQueue]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const priorityColors: Record<Priority, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleOverlayClick}>
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading card...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleOverlayClick}>
        <div className="bg-white rounded-xl p-8 max-w-md">
          <p className="text-red-600">{error || "Card not found"}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const assignee = members.find(m => m.id === card.assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={card.title}
              onChange={(e) => {
                setCard(prev => prev ? { ...prev, title: e.target.value } : null);
                debouncedSave({ title: e.target.value });
              }}
              className="text-2xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Card title..."
            />
            {isSaving && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <textarea
                  value={card.description || ""}
                  onChange={(e) => {
                    setCard(prev => prev ? { ...prev, description: e.target.value } : null);
                    debouncedSave({ description: e.target.value });
                  }}
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a description..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Assignee
                </h3>
                <select
                  value={card.assigneeId || ""}
                  onChange={(e) => {
                    const assigneeId = e.target.value || null;
                    setCard(prev => prev ? { ...prev, assigneeId } : null);
                    debouncedSave({ assigneeId });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                {assignee && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-medium">
                      {assignee.name.charAt(0)}
                    </div>
                    <span className="text-sm">{assignee.name}</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Due Date
                </h3>
                <input
                  type="date"
                  value={card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => {
                    const dueDate = e.target.value ? new Date(e.target.value).getTime() : null;
                    setCard(prev => prev ? { ...prev, dueDate } : null);
                    debouncedSave({ dueDate });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {card.dueDate && (
                  <p className="mt-2 text-sm text-gray-600">
                    {new Date(card.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Priority
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as Priority[]).map(priority => (
                    <button
                      key={priority}
                      onClick={() => {
                        setCard(prev => prev ? { ...prev, priority } : null);
                        debouncedSave({ priority });
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        priorityColors[priority]
                      } ${
                        card.priority === priority ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Created: {new Date(card.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {new Date(card.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}