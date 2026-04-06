'use client';

import { useState, useEffect } from 'react';
import ColumnList from './ColumnList';
import { Board, Project, Column, Card } from '@/lib/types';
import { useBoardSocket } from '@/hooks/useBoardSocket';

interface BoardViewProps {
  initialBoard: Board;
  initialProject: Project;
  initialColumns: Array<Column & { cards: Card[] }>;
  workspaceId: string;
}

interface DragState {
  type: 'card' | 'column';
  id: string;
  sourceColumnId?: string;
}

export default function BoardView({ 
  initialBoard, 
  initialProject, 
  initialColumns, 
  workspaceId 
}: BoardViewProps) {
  const [board] = useState(initialBoard);
  const [project] = useState(initialProject);
  const [columns, setColumns] = useState(initialColumns);
  const [isLoading, setIsLoading] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Connect to WebSocket for real-time updates
  const socket = useBoardSocket(board.id);

  // Handle incoming WebSocket updates
  useEffect(() => {
    if (!socket) return;

    const handleCardUpdate = (updatedCard: Card) => {
      setColumns(prev => prev.map(col => ({
        ...col,
        cards: col.cards.map(card => 
          card.id === updatedCard.id ? updatedCard : card
        )
      })));
    };

    const handleCardCreate = (newCard: Card) => {
      setColumns(prev => prev.map(col => {
        if (col.id === newCard.columnId) {
          return {
            ...col,
            cards: [...col.cards, newCard].sort((a, b) => 
              a.position.localeCompare(b.position)
            )
          };
        }
        return col;
      }));
    };

    const handleCardDelete = (cardId: string) => {
      setColumns(prev => prev.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId)
      })));
    };

    const handleCardMove = (cardId: string, newColumnId: string, newPosition: string) => {
      setColumns(prev => {
        const newColumns = [...prev];
        let movedCard: Card | null = null;
        
        // Remove card from old column
        newColumns.forEach(col => {
          if (col.cards.some(c => c.id === cardId)) {
            movedCard = col.cards.find(c => c.id === cardId) || null;
            col.cards = col.cards.filter(c => c.id !== cardId);
          }
        });

        // Add card to new column at correct position
        if (movedCard) {
          movedCard = { ...movedCard, columnId: newColumnId, position: newPosition };
          const targetColumn = newColumns.find(col => col.id === newColumnId);
          if (targetColumn) {
            targetColumn.cards = [...targetColumn.cards, movedCard].sort((a, b) => 
              a.position.localeCompare(b.position)
            );
          }
        }

        return newColumns;
      });
    };

    socket.on('card:update', handleCardUpdate);
    socket.on('card:create', handleCardCreate);
    socket.on('card:delete', handleCardDelete);
    socket.on('card:move', handleCardMove);

    return () => {
      socket.off('card:update', handleCardUpdate);
      socket.off('card:create', handleCardCreate);
      socket.off('card:delete', handleCardDelete);
      socket.off('card:move', handleCardMove);
    };
  }, [socket]);

  const handleDragStart = (type: 'card' | 'column', id: string, sourceColumnId?: string) => {
    setDragState({ type, id, sourceColumnId });
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!dragState || dragState.type !== 'card') return;

    const { id: cardId, sourceColumnId } = dragState;
    if (sourceColumnId === targetColumnId) {
      setDragState(null);
      return;
    }

    try {
      setIsLoading(true);
      
      // Find the target column and calculate new position
      const targetColumn = columns.find(col => col.id === targetColumnId);
      if (!targetColumn) return;

      const targetCards = targetColumn.cards;
      const newPosition = targetCards.length > 0 
        ? targetCards[targetCards.length - 1].position + '_' // Simplified - in practice use LexoRank
        : 'm';

      // Send move request to API
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          columnId: targetColumnId,
          position: newPosition 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move card');
      }

      const { data: updatedCard } = await response.json();
      
      // Update local state
      setColumns(prev => {
        const newColumns = [...prev];
        
        // Remove from old column
        newColumns.forEach(col => {
          if (col.id === sourceColumnId) {
            col.cards = col.cards.filter(card => card.id !== cardId);
          }
        });

        // Add to new column
        newColumns.forEach(col => {
          if (col.id === targetColumnId) {
            col.cards = [...col.cards, updatedCard].sort((a, b) => 
              a.position.localeCompare(b.position)
            );
          }
        });

        return newColumns;
      });
    } catch (error) {
      console.error('Error moving card:', error);
      alert('Failed to move card');
    } finally {
      setIsLoading(false);
      setDragState(null);
    }
  };

  const handleColumnReorder = async (columnId: string, newIndex: number) => {
    try {
      setIsLoading(true);
      
      // Calculate new position using LexoRank or similar
      const sortedColumns = [...columns].sort((a, b) => 
        a.position.localeCompare(b.position)
      );
      
      let newPosition: string;
      if (newIndex === 0) {
        // Move to beginning
        newPosition = sortedColumns[0].position.substring(0, sortedColumns[0].position.length - 1) + '0';
      } else if (newIndex >= sortedColumns.length - 1) {
        // Move to end
        newPosition = sortedColumns[sortedColumns.length - 1].position + '_';
      } else {
        // Move between two columns
        const prevPos = sortedColumns[newIndex - 1].position;
        const nextPos = sortedColumns[newIndex].position;
        newPosition = prevPos.substring(0, prevPos.length - 1) + 
                     String.fromCharCode((prevPos.charCodeAt(prevPos.length - 1) + nextPos.charCodeAt(nextPos.length - 1)) / 2);
      }

      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPosition }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder column');
      }

      const { data: updatedColumn } = await response.json();
      
      // Update local state
      setColumns(prev => 
        prev.map(col => 
          col.id === columnId 
            ? { ...col, position: updatedColumn.position } 
            : col
        ).sort((a, b) => a.position.localeCompare(b.position))
      );
    } catch (error) {
      console.error('Error reordering column:', error);
      alert('Failed to reorder column');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (columnId: string, title: string) => {
    try {
      setIsLoading(true);
      
      const column = columns.find(col => col.id === columnId);
      if (!column) return;

      // Calculate position for new card (at the end)
      const lastCard = column.cards[column.cards.length - 1];
      const newPosition = lastCard 
        ? lastCard.position + '_'
        : 'm';

      const response = await fetch(`/api/columns/${columnId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(),
          position: newPosition,
          columnId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      const { data: newCard } = await response.json();
      
      // Update local state
      setColumns(prev => 
        prev.map(col => {
          if (col.id === columnId) {
            return {
              ...col,
              cards: [...col.cards, newCard].sort((a, b) => 
                a.position.localeCompare(b.position)
              )
            };
          }
          return col;
        })
      );
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create card');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardEdit = (cardId: string) => {
    // This would open a card modal in a real implementation
    console.log('Edit card:', cardId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
        <p className="text-gray-600 mt-1">
          Project: {project.name} • Workspace: {workspaceId}
        </p>
      </div>
      
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 min-h-full">
          {columns.map((column, index) => (
            <ColumnList
              key={column.id}
              column={column}
              columnIndex={index}
              isDragging={dragState?.type === 'column' && dragState.id === column.id}
              onDragStart={() => handleDragStart('column', column.id)}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              onColumnReorder={handleColumnReorder}
              onAddCard={handleAddCard}
              onCardEdit={handleCardEdit}
              isLoading={isLoading}
            />
          ))}
          
          {/* Add Column Button */}
          <div className="w-64 flex-shrink-0">
            <button
              onClick={() => {
                // Implement column creation
                console.log('Add new column');
              }}
              className="w-full h-full min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-gray-600 hover:text-blue-600 font-medium">
                + Add Column
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}