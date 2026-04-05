'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Board, Column, Task } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import { AddColumnModal } from './AddColumnModal';
import { Button } from '@/components/UI/Button';
import { useDragAndDrop, DragItem, DropZone } from '@/hooks/useDragAndDrop';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Plus, Loader2, RefreshCw, Filter, Search, Grid3x3 } from 'lucide-react';

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const {
    dragItem,
    dropZone,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  } = useDragAndDrop({
    onDragEnd: async (item, target) => {
      if (item.type === 'task' && target?.type === 'column') {
        try {
          const response = await fetch(`/api/tasks/${item.id}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columnId: target.id }),
          });

          if (!response.ok) throw new Error('Failed to move task');
          
          toast.success('Task moved successfully');
          fetchBoardData();
        } catch (error) {
          toast.error('Failed to move task');
          console.error(error);
        }
      }
    },
  });

  const fetchBoardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch board details
      const boardRes = await fetch(`/api/boards/${boardId}`);
      if (!boardRes.ok) throw new Error('Failed to fetch board');
      const boardData = await boardRes.json();
      setBoard(boardData);

      // Fetch columns
      const columnsRes = await fetch(`/api/boards/${boardId}/columns`);
      if (!columnsRes.ok) throw new Error('Failed to fetch columns');
      const columnsData = await columnsRes.json();
      setColumns(columnsData);

      // Fetch tasks for all columns
      const tasksRes = await fetch(`/api/tasks?boardId=${boardId}`);
      if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching board data:', error);
      toast.error('Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleAddColumn = async (columnData: Partial<Column>) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columnData),
      });

      if (!response.ok) throw new Error('Failed to create column');
      
      const newColumn = await response.json();
      setColumns(prev => [...prev, newColumn]);
      setShowAddColumnModal(false);
      toast.success('Column created successfully');
    } catch (error) {
      toast.error('Failed to create column');
      console.error(error);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column? All tasks in this column will be moved to the first available column.')) {
      return;
    }

    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete column');
      
      setColumns(prev => prev.filter(col => col.id !== columnId));
      toast.success('Column deleted successfully');
    } catch (error) {
      toast.error('Failed to delete column');
      console.error(error);
    }
  };

  const handleUpdateColumn = async (columnId: string, updates: Partial<Column>) => {
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update column');
      
      const updatedColumn = await response.json();
      setColumns(prev => prev.map(col => 
        col.id === columnId ? updatedColumn : col
      ));
      toast.success('Column updated successfully');
    } catch (error) {
      toast.error('Failed to update column');
      console.error(error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getTasksForColumn = (columnId: string) => {
    return filteredTasks.filter(task => task.columnId === columnId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <Grid3x3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Board not found</h3>
        <p className="text-muted-foreground mb-4">The board you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-card/50 backdrop-blur-sm rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {board.name}
          </h1>
          <p className="text-muted-foreground mt-1">{board.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBoardData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            onClick={() => setShowAddColumnModal(true)}
            className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            <Plus className="h-4 w-4" />
            Add Column
          </Button>
        </div>
      </div>

      {/* Board Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 rounded-xl border">
          <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'todo').length}</div>
          <div className="text-sm text-muted-foreground">To Do</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-4 rounded-xl border">
          <div className="text-2xl font-bold text-amber-600">{tasks.filter(t => t.status === 'in_progress').length}</div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-4 rounded-xl border">
          <div className="text-2xl font-bold text-purple-600">{tasks.filter(t => t.status === 'review').length}</div>
          <div className="text-sm text-muted-foreground">In Review</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-4 rounded-xl border">
          <div className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === 'done').length}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <div
              key={column.id}
              className={cn(
                'flex-shrink-0 w-80 transition-all duration-200',
                dropZone?.id === column.id && 'ring-2 ring-primary ring-offset-2 rounded-lg'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                handleDragOver({ id: column.id, type: 'column', accepts: ['task'] });
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragItem && dragItem.type === 'task') {
                  handleDrop({ id: column.id, type: 'column', accepts: ['task'] });
                }
              }}
            >
              <KanbanColumn
                column={column}
                tasks={getTasksForColumn(column.id)}
                onTaskAdded={() => fetchBoardData()}
                onTaskUpdated={() => fetchBoardData()}
                onColumnDelete={handleDeleteColumn}
                onColumnUpdate={handleUpdateColumn}
                onDragStart={handleDragStart}
                isDragging={isDragging}
                dragItem={dragItem}
              />
            </div>
          ))}
          
          {/* Add Column Button (Alternative) */}
          <div className="flex-shrink-0 w-80">
            <button
              onClick={() => setShowAddColumnModal(true)}
              className="h-full w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 p-8 group"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium text-foreground">Add New Column</span>
              <span className="text-sm text-muted-foreground">Create a new workflow stage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Column Modal */}
      <AddColumnModal
        isOpen={showAddColumnModal}
        onClose={() => setShowAddColumnModal(false)}
        onSubmit={handleAddColumn}
      />
    </div>
  );
}