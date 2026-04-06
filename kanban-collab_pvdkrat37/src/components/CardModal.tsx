"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Calendar, User, Loader2 } from "lucide-react";
import { Card, User as UserType, WorkspaceMember } from "@/lib/types";
import { useToast } from "@/hooks/useToast";
import CommentSection from "./CommentSection";
import { format } from "date-fns";

interface CardModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  workspaceId: string;
  onUpdate?: (updatedCard: Card) => void;
}

export default function CardModal({
  cardId,
  isOpen,
  onClose,
  currentUserId,
  workspaceId,
  onUpdate,
}: CardModalProps) {
  const { toast } = useToast();
  const [card, setCard] = useState<Card | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  const fetchCard = useCallback(async () => {
    if (!cardId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cards/${cardId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch card");
      }
      const result = await response.json();
      if (result.data) {
        setCard(result.data);
        setFormData({
          title: result.data.title,
          description: result.data.description || "",
          assignedTo: result.data.assignedTo || "",
          dueDate: result.data.dueDate 
            ? format(new Date(result.data.dueDate), "yyyy-MM-dd") 
            : "",
        });
      }
    } catch (error) {
      toast({
        message: "Failed to load card details",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [cardId, toast]);

  const fetchWorkspaceMembers = useCallback(async () => {
    try {
      // Fetch workspace members via API
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch workspace members");
      }
      const result = await response.json();
      if (result.data) {
        setWorkspaceMembers(result.data);
      }
    } catch (error) {
      toast({
        message: "Failed to load workspace members",
        type: "error",
      });
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCard();
      fetchWorkspaceMembers();
    }
  }, [isOpen, cardId, fetchCard, fetchWorkspaceMembers]);

  const handleSave = async () => {
    if (!card) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          assignedTo: formData.assignedTo || null,
          dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update card");
      }

      const result = await response.json();
      if (result.data) {
        setCard(result.data);
        if (onUpdate) {
          onUpdate(result.data);
        }
        toast({
          message: "Card updated successfully",
          type: "success",
        });
      }
    } catch (error) {
      toast({
        message: "Failed to update card",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this card?")) return;
    
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      toast({
        message: "Card deleted successfully",
        type: "success",
      });
      onClose();
    } catch (error) {
      toast({
        message: "Failed to delete card",
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  const assignedUser = workspaceMembers.find(user => user.id === formData.assignedTo);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : card ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full text-2xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
                    placeholder="Card title"
                  />
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row">
                {/* Main content */}
                <div className="flex-1 p-6">
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a description..."
                    />
                  </div>

                  {/* Comments */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
                    <CommentSection
                      cardId={cardId}
                      currentUserId={currentUserId}
                      workspaceId={workspaceId}
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:w-80 border-l p-6 space-y-6">
                  {/* Assignee */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 mr-2" />
                      Assignee
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {workspaceMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                    {assignedUser && (
                      <div className="mt-2 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2">
                          {assignedUser.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-600">{assignedUser.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.dueDate && (
                      <div className="mt-2 text-sm text-gray-600">
                        {format(new Date(formData.dueDate), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <div className="mb-1">
                        <span className="font-medium">Created:</span>{" "}
                        {format(new Date(card.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <div>
                        <span className="font-medium">Last updated:</span>{" "}
                        {format(new Date(card.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t space-y-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !formData.title.trim()}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Delete Card
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">Card not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}