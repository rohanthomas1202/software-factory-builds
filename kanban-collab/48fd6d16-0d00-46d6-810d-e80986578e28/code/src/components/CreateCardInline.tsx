"use client";

import { useState, useRef, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { LexoRank } from "@/lib/lexorank";

interface CreateCardInlineProps {
  columnId: string;
  lastPosition: string | null;
  onCardCreated: () => void;
}

export default function CreateCardInline({
  columnId,
  lastPosition,
  onCardCreated,
}: CreateCardInlineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate position using LexoRank
      let position: string;
      if (lastPosition) {
        const rank = LexoRank.parse(lastPosition);
        position = rank.genNext().toString();
      } else {
        position = LexoRank.middle().toString();
      }

      const response = await fetch(`/api/columns/${columnId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          position,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create card");
      }

      setTitle("");
      setIsExpanded(false);
      onCardCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setTitle("");
      setIsExpanded(false);
      setError(null);
    }
  };

  const handleBlur = () => {
    if (!title.trim() && !isLoading) {
      setTitle("");
      setIsExpanded(false);
      setError(null);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
        Add a card
      </button>
    );
  }

  return (
    <div className="mt-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Enter card title..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isLoading}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleSubmit}
          disabled={isLoading || !title.trim()}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Adding..." : "Add card"}
        </button>
        <button
          onClick={() => {
            setTitle("");
            setIsExpanded(false);
            setError(null);
          }}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}