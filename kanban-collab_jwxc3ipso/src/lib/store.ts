import type {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Board,
  Column,
  Card,
  WorkspaceInvite,
  Session,
  Comment,
  Notification,
  CreateUserInput,
  CreateWorkspaceInput,
  CreateWorkspaceMemberInput,
  CreateProjectInput,
  CreateBoardInput,
  CreateColumnInput,
  CreateCardInput,
  CreateInviteInput,
  CreateCommentInput,
  CreateNotificationInput,
  UpdateCardInput,
  UpdateCommentInput,
  Role,
  Priority
} from './types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

class MemoryStore<T extends { id: string }> {
  private items = new Map<string, T>()

  findById(id: string): T | null {
    return this.items.get(id) || null
  }

  findAll(): T[] {
    return Array.from(this.items.values())
  }

  findWhere(predicate: (item: T) => boolean): T[] {
    return this.findAll().filter(predicate)
  }

  create(input: Omit<T, 'id'> & { id?: string }): T {
    const id = input.id || generateId()
    const now = Date.now()
    const item = { ...input, id } as T
    
    // Handle timestamps for entities that have them
    if ('createdAt' in item && !input.createdAt) {
      (item as any).createdAt = now
    }
    if ('updatedAt' in item && !input.updatedAt) {
      (item as any).updatedAt = now
    }
    if ('joinedAt' in item && !input.joinedAt) {
      (item as any).joinedAt = now
    }
    if ('expiresAt' in item && !input.expiresAt) {
      (item as any).expiresAt = now + 7 * 24 * 60 * 60 * 1000 // 7 days default
    }

    this.items.set(id, item)
    return item
  }

  update(id: string, updates: Partial<T>): T | null {
    const existing = this.items.get(id)
    if (!existing) return null
    
    const updated = { ...existing, ...updates, id }
    this.items.set(id, updated)
    return updated
  }

  delete(id: string): boolean {
    return this.items.delete(id)
  }

  deleteWhere(predicate: (item: T) => boolean): number {
    let count = 0
    for (const [id, item] of this.items.entries()) {
      if (predicate(item)) {
        this.items.delete(id)
        count++
      }
    }
    return count
  }

  count(): number {
    return this.items.size
  }

  clear(): void {
    this.items.clear()
  }
}

class Store {
  users = new MemoryStore<User>()
  workspaces = new MemoryStore<Workspace>()
  workspaceMembers = new MemoryStore<WorkspaceMember>()
  projects = new MemoryStore<Project>()
  boards = new MemoryStore<Board>()
  columns = new MemoryStore<Column>()
  cards = new MemoryStore<Card>()
  workspaceInvites = new MemoryStore<WorkspaceInvite>()
  sessions = new MemoryStore<Session>()
  comments = new MemoryStore<Comment>()
  notifications = new MemoryStore<Notification>()

  // User methods
  findByEmail(email: string): User | null {
    return this.users.findWhere(user => user.email === email)[0] || null
  }

  // Workspace methods
  findWorkspacesByUserId(userId: string): Workspace[] {
    const memberEntries = this.workspaceMembers.findWhere(member => member.userId === userId)
    const workspaceIds = memberEntries.map(member => member.workspaceId)
    return this.workspaces.findAll().filter(workspace => workspaceIds.includes(workspace.id))
  }

  findWorkspaceMembers(workspaceId: string): WorkspaceMember[] {
    return this.workspaceMembers.findWhere(member => member.workspaceId === workspaceId)
  }

  findWorkspaceMember(workspaceId: string, userId: string): WorkspaceMember | null {
    return this.workspaceMembers.findWhere(
      member => member.workspaceId === workspaceId && member.userId === userId
    )[0] || null
  }

  // Project methods
  findProjectsByWorkspaceId(workspaceId: string): Project[] {
    return this.projects.findWhere(project => project.workspaceId === workspaceId)
  }

  // Board methods
  findBoardsByProjectId(projectId: string): Board[] {
    return this.boards.findWhere(board => board.projectId === projectId)
  }

  // Column methods
  findColumnsByBoardId(boardId: string): Column[] {
    return this.columns.findWhere(column => column.boardId === boardId).sort((a, b) => a.position.localeCompare(b.position))
  }

  // Card methods
  findCardsByColumnId(columnId: string): Card[] {
    return this.cards.findWhere(card => card.columnId === columnId).sort((a, b) => a.position.localeCompare(b.position))
  }

  findCardsByBoardId(boardId: string): Card[] {
    const boardColumns = this.columns.findWhere(column => column.boardId === boardId)
    const columnIds = boardColumns.map(column => column.id)
    return this.cards.findAll().filter(card => columnIds.includes(card.columnId))
  }

  // WorkspaceInvite methods
  findInviteByToken(token: string): WorkspaceInvite | null {
    return this.workspaceInvites.findWhere(invite => invite.token === token)[0] || null
  }

  findInvitesByWorkspaceId(workspaceId: string): WorkspaceInvite[] {
    return this.workspaceInvites.findWhere(invite => invite.workspaceId === workspaceId)
  }

  findInviteByEmailAndWorkspaceId(email: string, workspaceId: string): WorkspaceInvite | null {
    return this.workspaceInvites.findWhere(
      invite => invite.email === email && invite.workspaceId === workspaceId
    )[0] || null
  }

  // Session methods
  findSessionByToken(token: string): Session | null {
    return this.sessions.findWhere(session => session.token === token)[0] || null
  }

  findSessionsByUserId(userId: string): Session[] {
    return this.sessions.findWhere(session => session.userId === userId)
  }

  // Comment methods
  findCommentsByCardId(cardId: string): Comment[] {
    return this.comments.findWhere(comment => comment.cardId === cardId).sort((a, b) => a.createdAt - b.createdAt)
  }

  // Notification methods
  findNotificationsByUserId(userId: string): Notification[] {
    return this.notifications.findWhere(notification => notification.userId === userId).sort((a, b) => b.createdAt - a.createdAt)
  }

  findUnreadNotificationsByUserId(userId: string): Notification[] {
    return this.notifications.findWhere(notification => notification.userId === userId && !notification.read)
  }

  clear(): void {
    this.users.clear()
    this.workspaces.clear()
    this.workspaceMembers.clear()
    this.projects.clear()
    this.boards.clear()
    this.columns.clear()
    this.cards.clear()
    this.workspaceInvites.clear()
    this.sessions.clear()
    this.comments.clear()
    this.notifications.clear()
  }
}

export const store = new Store()