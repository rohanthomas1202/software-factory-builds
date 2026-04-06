'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Column, Card } from '@/lib/types';
import { useToast } from './useToast';

interface UseBoardReturn {
  columns: Column[];
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  moveCard: (cardId: string, columnId: string, position: number) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  createCard: (columnId: string, title: string) => Promise<Card | null>;
  refresh: () => Promise<void>;
}

export default function useBoard(boardId: string): UseBoardReturn {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBoardData = useCallback(async () => {
    if (!boardId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch columns
      const columnsRes = await fetch(`/api/boards/${boardId}/columns`);
      if (!columnsRes.ok) {
        throw new Error('Failed to fetch columns');
      }
      const columnsData = await columnsRes.json();
      const fetchedColumns: Column[] = columnsData.data || [];

      // Fetch all cards for each column
      const cardPromises = fetchedColumns.map(async (column: Column) => {
        const cardsRes = await fetch(`/api/columns/${column.id}/cards`);
        if (!cardsRes.ok) {
          console.warn(`Failed to fetch cards for column ${column.id}`);
          return [];
        }
        const cardsData = await cardsRes.json();
        return cardsData.data || [];
      });

      const cardsArrays = await Promise.all(cardPromises);
      const allCards = cardsArrays.flat();

      setColumns(fetchedColumns.sort((a, b) => a.rank - b.rank));
      setCards(allCards);
    } catch (err) {
      console.error('Failed to fetch board data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load board');
      toast({
        message: 'Failed to load board data',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [boardId, toast]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const moveCard = useCallback(async (
    cardId: string,
    columnId: string,
    position: number
  ): Promise<void> => {
    try {
      // Optimistic update
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      const oldColumnId = card.columnId;
      const oldPosition = cards
        .filter(c => c.columnId === oldColumnId)
        .sort((a, b) => a.rank.localeCompare(b.rank))
        .findIndex(c => c.id === cardId);

      // Remove from old position
      const newCards = cards.filter(c => c.id !== cardId);
      
      // Insert at new position
      const targetColumnCards = newCards
        .filter(c => c.columnId === columnId)
        .sort((a, b) => a.rank.localeCompare(b.rank));
      
      const updatedCard = {
        ...card,
        columnId,
        rank: '', // Temporary rank, will be updated by server
      };

      // Insert into new position
      targetColumnCards.splice(position, 0, updatedCard);
      
      // Reconstruct cards array
      const finalCards = newCards
        .filter(c => c.columnId !== columnId)
        .concat(targetColumnCards);
      
      setCards(finalCards);

      // Send to server
      const response = await fetch(`/api/cards/${cardId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, position }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move card');
      }

      const { data: movedCard } = await response.json();
      
      // Update with server data
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, ...movedCard } : c
      ));

      toast({
        message: 'Card moved successfully',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to move card:', err);
      
      // Revert optimistic update
      fetchBoardData();
      
      toast({
        message: err instanceof Error ? err.message : 'Failed to move card',
        type: 'error',
      });
      throw err;
    }
  }, [cards, fetchBoardData, toast]);

  const updateCard = useCallback(async (
    cardId: string,
    updates: Partial<Card>
  ): Promise<void> => {
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
      fetchBoardData();
      
      toast({
        message: err instanceof Error ? err.message : 'Failed to update card',
        type: 'error',
      });
      throw err;
    }
  }, [fetchBoardData, toast]);

  const createCard = useCallback(async (
    columnId: string,
    title: string
  ): Promise<Card | null> => {
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

  return {
    columns,
    cards,
    isLoading,
    error,
    moveCard,
    updateCard,
    createCard,
    refresh: fetchBoardData,
  };
}