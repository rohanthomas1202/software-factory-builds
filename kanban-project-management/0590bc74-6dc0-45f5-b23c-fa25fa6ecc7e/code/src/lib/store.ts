/**
 * In-memory data store for KanbanFlow
 * Singleton pattern with Maps for all entities
 */

import { User, UserRole, Project, Board, Column, Task, Comment, TeamInvitation, AnalyticsData, TaskPriority, TaskStatus } from './types';

// In-memory storage
class DataStore {
  // Maps for each entity type
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private boards: Map<string, Board> = new Map();
  private columns: Map<string, Column> = new Map();
  private tasks: Map<string, Task> = new Map();
  private comments: Map<string, Comment> = new Map();
  private teamInvitations: Map<string, TeamInvitation> = new Map();
  private projectMembers: Map<string, Set<string>> = new Map(); // projectId -> Set<userId>
  private userSessions: Map<string, string> = new Map(); // sessionId -> userId

  // Singleton instance
  private static instance: DataStore;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  // User methods
  public getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  public createUser(user: User): void {
    this.users.set(user.id, user);
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  public deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  // Project methods
  public getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  public getProjectsByOwner(ownerId: string): Project[] {
    return Array.from(this.projects.values())
      .filter(project => project.ownerId === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getProjectsByMember(userId: string): Project[] {
    const memberProjects: Project[] = [];
    
    for (const [projectId, memberSet] of this.projectMembers) {
      if (memberSet.has(userId)) {
        const project = this.projects.get(projectId);
        if (project) {
          memberProjects.push(project);
        }
      }
    }
    
    return memberProjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public createProject(project: Project): void {
    this.projects.set(project.id, project);
    // Initialize members set
    this.projectMembers.set(project.id, new Set([project.ownerId]));
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  public deleteProject(id: string): boolean {
    // Delete all related boards, columns, tasks, comments
    const boards = this.getBoardsByProject(id);
    boards.forEach(board => this.deleteBoard(board.id));
    
    // Remove project members
    this.projectMembers.delete(id);
    
    return this.projects.delete(id);
  }

  // Project members methods
  public addProjectMember(projectId: string, userId: string): void {
    const members = this.projectMembers.get(projectId);
    if (members) {
      members.add(userId);
    } else {
      this.projectMembers.set(projectId, new Set([userId]));
    }
  }

  public removeProjectMember(projectId: string, userId: string): void {
    const members = this.projectMembers.get(projectId);
    if (members) {
      members.delete(userId);
    }
  }

  public getProjectMembers(projectId: string): string[] {
    const members = this.projectMembers.get(projectId);
    return members ? Array.from(members) : [];
  }

  public isProjectMember(projectId: string, userId: string): boolean {
    const members = this.projectMembers.get(projectId);
    return members ? members.has(userId) : false;
  }

  // Board methods
  public getBoard(id: string): Board | undefined {
    return this.boards.get(id);
  }

  public getBoardsByProject(projectId: string): Board[] {
    return Array.from(this.boards.values())
      .filter(board => board.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  public createBoard(board: Board): void {
    this.boards.set(board.id, board);
  }

  public updateBoard(id: string, updates: Partial<Board>): Board | undefined {
    const board = this.boards.get(id);
    if (!board) return undefined;

    const updatedBoard = {
      ...board,
      ...updates,
      updatedAt: new Date(),
    };
    this.boards.set(id, updatedBoard);
    return updatedBoard;
  }

  public deleteBoard(id: string): boolean {
    // Delete all related columns, tasks, comments
    const columns = this.getColumnsByBoard(id);
    columns.forEach(column => this.deleteColumn(column.id));
    
    return this.boards.delete(id);
  }

  // Column methods
  public getColumn(id: string): Column | undefined {
    return this.columns.get(id);
  }

  public getColumnsByBoard(boardId: string): Column[] {
    return Array.from(this.columns.values())
      .filter(column => column.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  }

  public createColumn(column: Column): void {
    this.columns.set(column.id, column);
  }

  public updateColumn(id: string, updates: Partial<Column>): Column | undefined {
    const column = this.columns.get(id);
    if (!column) return undefined;

    const updatedColumn = {
      ...column,
      ...updates,
      updatedAt: new Date(),
    };
    this.columns.set(id, updatedColumn);
    return updatedColumn;
  }

  public deleteColumn(id: string): boolean {
    // Delete all related tasks and comments
    const tasks = this.getTasksByColumn(id);
    tasks.forEach(task => this.deleteTask(task.id));
    
    return this.columns.delete(id);
  }

  // Task methods
  public getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  public getTasksByColumn(columnId: string): Task[] {
    return Array.from(this.tasks.values())
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }

  public getTasksByProject(projectId: string): Task[] {
    const boards = this.getBoardsByProject(projectId);
    const tasks: Task[] = [];
    
    boards.forEach(board => {
      const columns = this.getColumnsByBoard(board.id);
      columns.forEach(column => {
        const columnTasks = this.getTasksByColumn(column.id);
        tasks.push(...columnTasks);
      });
    });
    
    return tasks;
  }

  public createTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  public updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  public moveTask(taskId: string, columnId: string, order: number): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    // Update order of other tasks in the new column
    const tasksInNewColumn = this.getTasksByColumn(columnId)
      .filter(t => t.id !== taskId)
      .sort((a, b) => a.order - b.order);
    
    // Reorder tasks
    const updatedTasks: Task[] = [];
    let currentOrder = 0;
    
    for (let i = 0; i < tasksInNewColumn.length; i++) {
      if (currentOrder === order) currentOrder++;
      const t = tasksInNewColumn[i];
      if (t.order !== currentOrder) {
        this.updateTask(t.id, { order: currentOrder });
      }
      currentOrder++;
    }
    
    // Update the moved task
    return this.updateTask(taskId, {
      columnId,
      order,
      updatedAt: new Date(),
    });
  }

  public deleteTask(id: string): boolean {
    // Delete all related comments
    const comments = this.getCommentsByTask(id);
    comments.forEach(comment => this.deleteComment(comment.id));
    
    return this.tasks.delete(id);
  }

  // Comment methods
  public getComment(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  public getCommentsByTask(taskId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  public createComment(comment: Comment): void {
    this.comments.set(comment.id, comment);
  }

  public updateComment(id: string, updates: Partial<Comment>): Comment | undefined {
    const comment = this.comments.get(id);
    if (!comment) return undefined;

    const updatedComment = {
      ...comment,
      ...updates,
      updatedAt: new Date(),
    };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  public deleteComment(id: string): boolean {
    return this.comments.delete(id);
  }

  // Team invitation methods
  public getInvitation(id: string): TeamInvitation | undefined {
    return this.teamInvitations.get(id);
  }

  public getInvitationByToken(token: string): TeamInvitation | undefined {
    return Array.from(this.teamInvitations.values()).find(inv => inv.token === token);
  }

  public createInvitation(invitation: TeamInvitation): void {
    this.teamInvitations.set(invitation.id, invitation);
  }

  public updateInvitation(id: string, updates: Partial<TeamInvitation>): TeamInvitation | undefined {
    const invitation = this.teamInvitations.get(id);
    if (!invitation) return undefined;

    const updatedInvitation = {
      ...invitation,
      ...updates,
      updatedAt: new Date(),
    };
    this.teamInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  public deleteInvitation(id: string): boolean {
    return this.teamInvitations.delete(id);
  }

  // Session methods
  public createSession(sessionId: string, userId: string): void {
    this.userSessions.set(sessionId, userId);
  }

  public getUserIdBySession(sessionId: string): string | undefined {
    return this.userSessions.get(sessionId);
  }

  public deleteSession(sessionId: string): boolean {
    return this.userSessions.delete(sessionId);
  }

  // Analytics methods
  public getAnalyticsData(userId: string): AnalyticsData {
    const userProjects = this.getProjectsByOwner(userId);
    const memberProjects = this.getProjectsByMember(userId);
    const allProjects = [...userProjects, ...memberProjects];
    const uniqueProjects = Array.from(new Map(allProjects.map(p => [p.id, p])).values());
    
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let highPriorityTasks = 0;
    const taskStatusCount: Record<TaskStatus, number> = {
      'todo': 0,
      'in_progress': 0,
      'review': 0,
      'done': 0,
      'blocked': 0,
    };
    
    const taskPriorityCount: Record<TaskPriority, number> = {
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0,
    };
    
    const dailyTaskCounts: Array<{ date: string; count: number }> = [];
    const userWorkload: Array<{ userId: string; taskCount: number; completedCount: number }> = [];
    
    // Calculate task statistics
    uniqueProjects.forEach(project => {
      const tasks = this.getTasksByProject(project.id);
      totalTasks += tasks.length;
      
      tasks.forEach(task => {
        if (task.status === 'done') {
          completedTasks++;
        }
        
        if (task.dueDate && task.dueDate < new Date() && task.status !== 'done') {
          overdueTasks++;
        }
        
        if (task.priority === 'high' || task.priority === 'critical') {
          highPriorityTasks++;
        }
        
        // Count by status
        taskStatusCount[task.status]++;
        
        // Count by priority
        taskPriorityCount[task.priority]++;
        
        // Track assignee workload
        if (task.assigneeId) {
          const existing = userWorkload.find(w => w.userId === task.assigneeId);
          if (existing) {
            existing.taskCount++;
            if (task.status === 'done') existing.completedCount++;
          } else {
            userWorkload.push({
              userId: task.assigneeId!,
              taskCount: 1,
              completedCount: task.status === 'done' ? 1 : 0,
            });
          }
        }
      });
    });
    
    // Generate daily task counts for last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let dayCount = 0;
      uniqueProjects.forEach(project => {
        const tasks = this.getTasksByProject(project.id);
        tasks.forEach(task => {
          const taskDate = task.createdAt.toISOString().split('T')[0];
          if (taskDate === dateStr) {
            dayCount++;
          }
        });
      });
      
      dailyTaskCounts.push({ date: dateStr, count: dayCount });
    }
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average tasks per project
    const avgTasksPerProject = uniqueProjects.length > 0 ? totalTasks / uniqueProjects.length : 0;
    
    return {
      totalProjects: uniqueProjects.length,
      totalTasks,
      completedTasks,
      overdueTasks,
      highPriorityTasks,
      completionRate,
      avgTasksPerProject,
      taskStatusCount,
      taskPriorityCount,
      dailyTaskCounts,
      userWorkload,
    };
  }

  // Clear all data (for testing/reset)
  public clear(): void {
    this.users.clear();
    this.projects.clear();
    this.boards.clear();
    this.columns.clear();
    this.tasks.clear();
    this.comments.clear();
    this.teamInvitations.clear();
    this.projectMembers.clear();
    this.userSessions.clear();
  }
}

// Export singleton instance
export const store = DataStore.getInstance();