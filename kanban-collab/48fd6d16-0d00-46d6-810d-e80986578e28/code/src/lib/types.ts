export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string
  createdAt: number
}

export interface Workspace {
  id: string
  name: string
  ownerId: string
  createdAt: number
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: Role
  joinedAt: number
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  description: string
  createdAt: number
}

export interface Board {
  id: string
  projectId: string
  name: string
  createdAt: number
}

export interface Column {
  id: string
  boardId: string
  name: string
  position: string
  createdAt: number
}

export interface Card {
  id: string
  columnId: string
  title: string
  description: string
  assigneeId: string | null
  dueDate: number | null
  priority: Priority
  position: string
  createdAt: number
  updatedAt: number
}

export interface WorkspaceInvite {
  id: string
  workspaceId: string
  email: string
  token: string
  role: Role
  invitedBy: string
  createdAt: number
  expiresAt: number
}

export interface Session {
  token: string
  userId: string
  createdAt: number
  expiresAt: number
}

export interface Comment {
  id: string
  cardId: string
  authorId: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface Notification {
  id: string
  userId: string
  commentId: string
  cardId: string
  read: boolean
  createdAt: number
}

export type Role = 'owner' | 'member'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type CreateUserInput = Omit<User, 'id' | 'createdAt'>
export type CreateWorkspaceInput = Omit<Workspace, 'id' | 'createdAt'>
export type CreateWorkspaceMemberInput = Omit<WorkspaceMember, 'id' | 'joinedAt'>
export type CreateProjectInput = Omit<Project, 'id' | 'createdAt'>
export type CreateBoardInput = Omit<Board, 'id' | 'createdAt'>
export type CreateColumnInput = Omit<Column, 'id' | 'createdAt'>
export type CreateCardInput = Omit<Card, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCardInput = Partial<Omit<CreateCardInput, 'columnId'>> & { columnId?: string }
export type CreateInviteInput = Omit<WorkspaceInvite, 'id' | 'token' | 'createdAt' | 'expiresAt'>
export type CreateCommentInput = Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCommentInput = Partial<Omit<CreateCommentInput, 'cardId' | 'authorId'>>
export type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt'>