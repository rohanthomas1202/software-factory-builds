/**
 * Core type definitions for KanbanFlow
 */

// User roles
export type UserRole = 'admin' | 'member' | 'viewer';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  teamMemberIds: string[];
  color?: string;
  icon?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Board interface
export interface Board {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  ownerId: string;
  columnOrder: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Task status
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

// Column interface
export interface Column {
  id: string;
  name: string;
  boardId: string;
  order: number;
  taskIds: string[];
  color?: string;
  wipLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  boardId: string;
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  tags: string[];
  attachments: string[];
  order: number;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

// Comment interface
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  parentCommentId?: string;
  mentions: string[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Team invitation interface
export interface TeamInvitation {
  id: string;
  email: string;
  projectId: string;
  inviterId: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

// Analytics data interface
export interface AnalyticsData {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  averageCompletionTime: number; // in hours
  teamWorkload: Array<{
    userId: string;
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
  }>;
  dailyTaskCount: Array<{
    date: string;
    count: number;
  }>;
  createdAt: Date;
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter and sort options
export interface TaskFilterOptions {
  assigneeId?: string;
  priority?: TaskPriority[];
  status?: TaskStatus[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
  direction: 'asc' | 'desc';
}

// Real-time event types
export type BoardEventType = 
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.moved'
  | 'column.created'
  | 'column.updated'
  | 'column.deleted'
  | 'comment.created'
  | 'comment.updated'
  | 'comment.deleted';

export interface BoardEvent {
  type: BoardEventType;
  boardId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

// Drag and drop interfaces
export interface DragItem {
  type: 'task' | 'column';
  id: string;
  columnId?: string;
  index: number;
}

// Form data interfaces
export interface CreateProjectData {
  name: string;
  description: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  teamMemberIds?: string[];
  isArchived?: boolean;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  projectId: string;
}

export interface CreateColumnData {
  name: string;
  boardId: string;
  color?: string;
  wipLimit?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  columnId: string;
  boardId: string;
  projectId: string;
  assigneeId?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  tags?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: TaskStatus;
  order?: number;
}

export interface MoveTaskData {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  newIndex: number;
}

export interface CreateCommentData {
  content: string;
  taskId: string;
  parentCommentId?: string;
  mentions?: string[];
}

// Search interfaces
export interface SearchResult {
  tasks: Task[];
  projects: Project[];
  boards: Board[];
  users: User[];
}

export interface SearchOptions {
  query: string;
  limit?: number;
  projectId?: string;
  boardId?: string;
}