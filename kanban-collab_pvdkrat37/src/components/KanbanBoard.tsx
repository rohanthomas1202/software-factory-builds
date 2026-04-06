'use client';

import { useState, useCallback } from 'react';
import type { Column, Card } from '@/lib/types';
import KanbanColumn from './KanbanColumn';
import { useToast } from '@/hooks/useToast';

interface KanbanBoardProps {
  initialColumns: Column[];
  initialCards: Card[];
  boardId: string;
  currentUserId: string;
}

export default function KanbanBoard({
  initialColumns,
  initialCards,
  boardId,
  currentUserId,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragStart = useCallback((cardId: string) => {
    setDraggingCardId(cardId);
  }, []);

  const handleDrop = useCallback(async (
    columnId: string,
    position: number
  ) => {
    if (!draggingCardId) return;

    const card = cards.find(c => c.id === draggingCardId);
    if (!card) return;

    // Don't do anything if dropping in the same position
    if (card.columnId === columnId) {
      const currentColumnCards = cards
        .filter(c => c.columnId === columnId)
        .sort((a, b) => a.rank.localeCompare(b.rank));
      const currentPosition = currentColumnCards.findIndex(c => c.id === card.id);
      if (currentPosition === position) {
        setDraggingCardId(null);
        return;
      }
    }

    setLoadingCardId(draggingCardId);

    try {
      // Optimistic update
      const newCards = cards.filter(c => c.id !== draggingCardId);
      const movedCard = { ...card, columnId };
      const targetColumnCards = newCards
        .filter(c => c.columnId === columnId)
        .sort((a, b) => a.rank.localeCompare(b.rank));
      
      targetColumnCards.splice(position, 0, movedCard);
      
      const finalCards = newCards
        .filter(c => c.columnId !== columnId)
        .concat(targetColumnCards);
      
      setCards(finalCards);

      // Send to server
      const response = await fetch(`/api/cards/${draggingCardId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, position }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move card');
      }

      const { data: updatedCard } = await response.json();
      
      // Update with server data
      setCards(prev => prev.map(c => 
        c.id === draggingCardId ? updatedCard : c
      ));

      toast({
        message: 'Card moved successfully',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to move card:', err);
      
      // Revert optimistic update
      setCards(initialCards);
      
      toast({
        message: err instanceof Error ? err.message : 'Failed to move card',
        type: 'error',
      });
    } finally {
      setDraggingCardId(null);
      setLoadingCardId(null);
    }
  }, [cards, draggingCardId, initialCards, toast]);

  const handleCardUpdate = useCallback(async (
    cardId: string,
    updates: Partial<Card>
  ) => {
    try {
      // Optimistic update
      setCards(prev => prev.map(card =>
        card.id === cardId ? { ...card, ...updates } : card
      ));

      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update card');
      }

      const { data: updatedCard } = await response.json();
      
      // Update with server data
      setCards(prev => prev.map(card =>
        card.id === cardId ? updatedCard : card
      ));

      toast({
        message: 'Card updated successfully',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to update card:', err);
      
      // Revert optimistic update
      setCards(initialCards);
      
      toast({
        message: err instanceof Error ? err.message : 'Failed to update card',
        type: 'error',
      });
    }
  }, [initialCards, toast]);

  const handleCreateCard = useCallback(async (
    columnId: string,
    title: string
  ) => {
    try {
      const response = await fetch(`/api/columns/${columnId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create card');
      }

      const { data: newCard } = await response.json();
      
      setCards(prev => [...prev, newCard]);

      toast({
        message: 'Card created successfully',
        type: 'success',
      });

      return newCard;
    } catch (err) {
      console.error('Failed to create card:', err);
      toast({
        message: err instanceof Error ? err.message : 'Failed to create card',
        type: 'error',
      });
      return null;
    }
  }, [toast]);

  return (
    <div className="flex gap-6 p-6 overflow-x-auto min-h-[calc(100vh-200px)]">
      {columns.map((column) => {
        const columnCards = cards
          .filter((card: Card) => card.columnId === column.id)
          .sort((a: Card, b: Card) => a.rank.localeCompare(b.rank));

        return (
          <KanbanColumn
            key={column.id}
            column={column}
            cards={columnCards}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onCardUpdate={handleCardUpdate}
            onCreateCard={handleCreateCard}
            currentUserId={currentUserId}
            isDragging={draggingCardId !== null}
            loadingCardId={loadingCardId}
          />
        );
      })}
    </div>
  );
}