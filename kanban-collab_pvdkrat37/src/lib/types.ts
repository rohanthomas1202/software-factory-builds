export interface User {
  id: string
  email: string
  password: string
  name: string
  avatarUrl: string
  emailVerified: boolean
  createdAt: number
  updatedAt: number
}

export interface Workspace {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: 'owner' | 'member'
  joinedAt: number
}

export interface Board {
  id: string
  workspaceId: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: string
  boardId: string
  name: string
  rank: number
  createdAt: number
  updatedAt: number
}

export interface Card {
  id: string
  columnId: string
  title: string
  description: string
  rank: number
  createdBy: string
  assignedTo: string
  dueDate: number
  createdAt: number
  updatedAt: number
}

export interface Comment {
  id: string
  cardId: string
  userId: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface Invite {
  id: string
  workspaceId: string
  email: string
  role: 'owner' | 'member'
  invitedBy: string
  token: string
  expiresAt: number
  acceptedAt: number | null
  createdAt: number
}

export interface Notification {
  id: string
  userId: string
  type: 'invite' | 'mention' | 'assignment' | 'due_date'
  title: string
  message: string
  read: boolean
  link: string
  createdAt: number
}

export interface EntityMap<T> {
  findById(id: string): T | undefined
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | undefined
  delete(id: string): boolean
  getAll(): T[]
}

export interface Store {
  users: EntityMap<User>
  workspaces: EntityMap<Workspace>
  workspaceMembers: EntityMap<WorkspaceMember>
  boards: EntityMap<Board>
  columns: EntityMap<Column>
  cards: EntityMap<Card>
  comments: EntityMap<Comment>
  invites: EntityMap<Invite>
  notifications: EntityMap<Notification>
}