export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
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
  estimateHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
  position: number;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  color: string;
  position: number;
  taskLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  columns: string[]; // column IDs
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  boards: string[]; // board IDs
  ownerId: string;
  members: string[]; // user IDs
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'archived' | 'completed';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[]; // user IDs
  projects: string[]; // project IDs
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 'task_assigned' | 'task_due' | 'task_completed' | 'comment_mentioned' | 'project_invite' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export type ActivityType = 'task_created' | 'task_updated' | 'task_moved' | 'comment_added' | 'project_created' | 'board_created' | 'user_joined';

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  entityType: 'task' | 'project' | 'board' | 'comment' | 'user';
  entityId: string;
  data: Record<string, any>;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface StoreData {
  users: User[];
  tasks: Task[];
  comments: Comment[];
  columns: Column[];
  boards: Board[];
  projects: Project[];
  teams: Team[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  sessions: Session[];
}