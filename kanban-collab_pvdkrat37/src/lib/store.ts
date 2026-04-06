/**
 * In-memory data store for the Kanban collaboration app.
 * Uses module-level singleton Maps for each entity type.
 */

import type {
  User,
  Workspace,
  WorkspaceMember,
  Board,
  Column,
  Card,
  Comment,
  Invite,
  Notification,
  Store as StoreType,
  EntityMap,
} from './types';

// Generic in-memory store implementation
class MemoryStore<T extends { id: string }> implements EntityMap<T> {
  private items = new Map<string, T>();
  private listeners = new Set<(items: T[]) => void>();

  create(item: Omit<T, 'id'> & { id?: string }): T {
    const id = item.id || generateId();
    const now = Date.now();
    const newItem = { ...item, id, createdAt: now, updatedAt: now } as T;
    this.items.set(id, newItem);
    this.notify();
    return newItem;
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    } as T;
    this.items.set(id, updated);
    this.notify();
    return updated;
  }

  delete(id: string): boolean {
    const existed = this.items.delete(id);
    if (existed) this.notify();
    return existed;
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.getAll().find(predicate);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  subscribe(listener: (items: T[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const items = this.getAll();
    this.listeners.forEach(listener => listener(items));
  }
}

// Utility function to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

// User store
const users = new MemoryStore<User>();

export function createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
  return users.create(user);
}

export function findUserById(id: string): User | undefined {
  return users.findById(id);
}

export function findUserByEmail(email: string): User | undefined {
  return users.find(user => user.email === email);
}

export function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined {
  return users.update(id, updates);
}

// Workspace store
const workspaces = new MemoryStore<Workspace>();

export function createWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Workspace {
  return workspaces.create(workspace);
}

export function findWorkspaceById(id: string): Workspace | undefined {
  return workspaces.findById(id);
}

export function findWorkspacesByUserId(userId: string): Workspace[] {
  const memberWorkspaceIds = workspaceMembers
    .filter((member: WorkspaceMember) => member.userId === userId)
    .map((member: WorkspaceMember) => member.workspaceId);
  
  return workspaces
    .getAll()
    .filter((workspace: Workspace) => memberWorkspaceIds.includes(workspace.id));
}

export function updateWorkspace(id: string, updates: Partial<Omit<Workspace, 'id' | 'createdAt'>>): Workspace | undefined {
  return workspaces.update(id, updates);
}

export function deleteWorkspace(id: string): boolean {
  // Delete related members
  workspaceMembers
    .filter((member: WorkspaceMember) => member.workspaceId === id)
    .forEach((member: WorkspaceMember) => workspaceMembers.delete(member.id));
  
  // Delete related boards
  boards
    .filter((board: Board) => board.workspaceId === id)
    .forEach((board: Board) => deleteBoard(board.id));
  
  // Delete related invites
  invites
    .filter((invite: Invite) => invite.workspaceId === id)
    .forEach((invite: Invite) => invites.delete(invite.id));
  
  return workspaces.delete(id);
}

// WorkspaceMember store
const workspaceMembers = new MemoryStore<WorkspaceMember>();

export function createWorkspaceMember(member: Omit<WorkspaceMember, 'id' | 'joinedAt'>): WorkspaceMember {
  const now = Date.now();
  const newMember = {
    ...member,
    id: generateId(),
    joinedAt: now,
  };
  return workspaceMembers.create(newMember);
}

export function findWorkspaceMembersByWorkspaceId(workspaceId: string): WorkspaceMember[] {
  return workspaceMembers.filter((member: WorkspaceMember) => member.workspaceId === workspaceId);
}

export function findWorkspaceMember(workspaceId: string, userId: string): WorkspaceMember | undefined {
  return workspaceMembers.find((member: WorkspaceMember) => 
    member.workspaceId === workspaceId && member.userId === userId
  );
}

export function deleteWorkspaceMember(id: string): boolean {
  return workspaceMembers.delete(id);
}

// Board store
const boards = new MemoryStore<Board>();

export function createBoard(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Board {
  return boards.create(board);
}

export function findBoardById(id: string): Board | undefined {
  return boards.findById(id);
}

export function findBoardsByWorkspaceId(workspaceId: string): Board[] {
  return boards.filter((board: Board) => board.workspaceId === workspaceId);
}

export function updateBoard(id: string, updates: Partial<Omit<Board, 'id' | 'createdAt'>>): Board | undefined {
  return boards.update(id, updates);
}

export function deleteBoard(id: string): boolean {
  // Delete related columns
  columns
    .filter((column: Column) => column.boardId === id)
    .forEach((column: Column) => deleteColumn(column.id));
  
  return boards.delete(id);
}

// Column store
const columns = new MemoryStore<Column>();

export function createColumn(column: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>): Column {
  return columns.create(column);
}

export function findColumnById(id: string): Column | undefined {
  return columns.findById(id);
}

export function findColumnsByBoardId(boardId: string): Column[] {
  return columns.filter((column: Column) => column.boardId === boardId);
}

export function updateColumn(id: string, updates: Partial<Omit<Column, 'id' | 'createdAt'>>): Column | undefined {
  return columns.update(id, updates);
}

export function deleteColumn(id: string): boolean {
  // Delete related cards
  cards
    .filter((card: Card) => card.columnId === id)
    .forEach((card: Card) => cards.delete(card.id));
  
  return columns.delete(id);
}

// Card store
const cards = new MemoryStore<Card>();

export function createCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Card {
  return cards.create(card);
}

export function findCardById(id: string): Card | undefined {
  return cards.findById(id);
}

export function findCardsByColumnId(columnId: string): Card[] {
  return cards.filter((card: Card) => card.columnId === columnId);
}

export function updateCard(id: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>): Card | undefined {
  return cards.update(id, updates);
}

export function deleteCard(id: string): boolean {
  // Delete related comments
  comments
    .filter((comment: Comment) => comment.cardId === id)
    .forEach((comment: Comment) => comments.delete(comment.id));
  
  return cards.delete(id);
}

// Comment store
const comments = new MemoryStore<Comment>();

export function createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Comment {
  return comments.create(comment);
}

export function findCommentsByCardId(cardId: string): Comment[] {
  return comments.filter((comment: Comment) => comment.cardId === cardId);
}

export function updateComment(id: string, updates: Partial<Omit<Comment, 'id' | 'createdAt'>>): Comment | undefined {
  return comments.update(id, updates);
}

export function deleteComment(id: string): boolean {
  return comments.delete(id);
}

// Invite store
const invites = new MemoryStore<Invite>();

export function createInvite(invite: Omit<Invite, 'id' | 'createdAt'>): Invite {
  const now = Date.now();
  const newInvite = {
    ...invite,
    id: generateId(),
    createdAt: now,
  };
  return invites.create(newInvite);
}

export function findInviteById(id: string): Invite | undefined {
  return invites.findById(id);
}

export function findInviteByToken(token: string): Invite | undefined {
  return invites.find((invite: Invite) => invite.token === token);
}

export function findInvitesByWorkspaceId(workspaceId: string): Invite[] {
  return invites.filter((invite: Invite) => invite.workspaceId === workspaceId);
}

export function updateInvite(id: string, updates: Partial<Omit<Invite, 'id' | 'createdAt'>>): Invite | undefined {
  return invites.update(id, updates);
}

export function deleteInvite(id: string): boolean {
  return invites.delete(id);
}

// Notification store
const notifications = new MemoryStore<Notification>();

export function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
  const now = Date.now();
  const newNotification = {
    ...notification,
    id: generateId(),
    createdAt: now,
  };
  return notifications.create(newNotification);
}

export function findNotificationsByUserId(userId: string): Notification[] {
  return notifications.filter((notification: Notification) => notification.userId === userId);
}

export function updateNotification(id: string, updates: Partial<Omit<Notification, 'id' | 'createdAt'>>): Notification | undefined {
  return notifications.update(id, updates);
}

export function deleteNotification(id: string): boolean {
  return notifications.delete(id);
}

// Export the consolidated store
export const store: StoreType = {
  users,
  workspaces,
  workspaceMembers,
  boards,
  columns,
  cards,
  comments,
  invites,
  notifications,
};