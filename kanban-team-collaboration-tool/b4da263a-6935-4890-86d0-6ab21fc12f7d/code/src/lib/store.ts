import { 
  StoreData, 
  User, 
  Task, 
  Comment, 
  Column, 
  Board, 
  Project, 
  Team, 
  Notification, 
  ActivityLog,
  Session,
  TaskPriority,
  TaskStatus,
  UserRole,
  NotificationType,
  ActivityType
} from './types';

class InMemoryStore {
  private static instance: InMemoryStore;
  private data: StoreData;

  private constructor() {
    this.data = this.initializeData();
  }

  public static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  private initializeData(): StoreData {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Users
    const users: User[] = [
      {
        id: 'user-1',
        email: 'alex@example.com',
        name: 'Alex Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        role: 'admin',
        createdAt: now,
      },
      {
        id: 'user-2',
        email: 'sarah@example.com',
        name: 'Sarah Miller',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        role: 'member',
        createdAt: now,
      },
      {
        id: 'user-3',
        email: 'mike@example.com',
        name: 'Mike Chen',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        role: 'member',
        createdAt: now,
      },
      {
        id: 'user-4',
        email: 'jessica@example.com',
        name: 'Jessica Lee',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
        role: 'viewer',
        createdAt: now,
      },
    ];

    // Teams
    const teams: Team[] = [
      {
        id: 'team-1',
        name: 'Product Development',
        description: 'Core product development team',
        ownerId: 'user-1',
        members: ['user-1', 'user-2', 'user-3', 'user-4'],
        projects: ['project-1', 'project-2'],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Projects
    const projects: Project[] = [
      {
        id: 'project-1',
        name: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI/UX',
        teamId: 'team-1',
        boards: ['board-1'],
        ownerId: 'user-1',
        members: ['user-1', 'user-2', 'user-3'],
        startDate: now,
        endDate: nextWeek,
        status: 'active',
        tags: ['design', 'frontend', 'high-priority'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'project-2',
        name: 'Mobile App Launch',
        description: 'New mobile application for iOS and Android',
        teamId: 'team-1',
        boards: ['board-2'],
        ownerId: 'user-2',
        members: ['user-1', 'user-2', 'user-4'],
        startDate: now,
        endDate: nextWeek,
        status: 'active',
        tags: ['mobile', 'launch', 'backend'],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Boards
    const boards: Board[] = [
      {
        id: 'board-1',
        projectId: 'project-1',
        name: 'Development Board',
        description: 'Main development workflow',
        columns: ['column-1', 'column-2', 'column-3', 'column-4'],
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-1',
      },
      {
        id: 'board-2',
        projectId: 'project-2',
        name: 'Launch Planning',
        description: 'Mobile app launch preparation',
        columns: ['column-5', 'column-6', 'column-7', 'column-8'],
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-2',
      },
    ];

    // Columns
    const columns: Column[] = [
      // Board 1 columns
      {
        id: 'column-1',
        boardId: 'board-1',
        title: 'Backlog',
        description: 'Tasks waiting to be started',
        color: '#94a3b8',
        position: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'column-2',
        boardId: 'board-1',
        title: 'In Progress',
        description: 'Tasks currently being worked on',
        color: '#3b82f6',
        position: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'column-3',
        boardId: 'board-1',
        title: 'Review',
        description: 'Tasks ready for review',
        color: '#f59e0b',
        position: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'column-4',
        boardId: 'board-1',
        title: 'Done',
        description: 'Completed tasks',
        color: '#10b981',
        position: 3,
        createdAt: now,
        updatedAt: now,
      },
      // Board 2 columns
      {
        id: 'column-5',
        boardId: 'board-2',
        title: 'Planning',
        description: 'Tasks in planning phase',
        color: '#8b5cf6',
        position: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'column-6',
        boardId: 'board-2',
        title: 'Development',
        description: 'Tasks in development',
        color: '#3b82f6',
        position: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'column-7',
        boardId: 'board-2',
        title: 'Testing',
        description: 'Tasks in testing phase',
        color: '#f59e0b',
        position: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'column-8',
        boardId: 'board-2',
        title: 'Deployed',
        description: 'Tasks deployed to production',
        color: '#10b981',
        position: 3,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Tasks
    const tasks: Task[] = [
      {
        id: 'task-1',
        title: 'Design homepage layout',
        description: 'Create wireframes and mockups for the new homepage',
        columnId: 'column-1',
        boardId: 'board-1',
        projectId: 'project-1',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        priority: 'high',
        status: 'todo',
        dueDate: tomorrow,
        tags: ['design', 'ui/ux'],
        attachments: [],
        estimateHours: 8,
        actualHours: 0,
        createdAt: now,
        updatedAt: now,
        position: 0,
      },
      {
        id: 'task-2',
        title: 'Implement user authentication',
        description: 'Set up secure login and registration system',
        columnId: 'column-2',
        boardId: 'board-1',
        projectId: 'project-1',
        assigneeId: 'user-3',
        reporterId: 'user-1',
        priority: 'critical',
        status: 'in_progress',
        dueDate: nextWeek,
        tags: ['backend', 'security'],
        attachments: [],
        estimateHours: 16,
        actualHours: 8,
        createdAt: now,
        updatedAt: now,
        position: 0,
      },
      {
        id: 'task-3',
        title: 'Fix mobile responsive issues',
        description: 'Address layout problems on mobile devices',
        columnId: 'column-3',
        boardId: 'board-1',
        projectId: 'project-1',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        priority: 'medium',
        status: 'review',
        dueDate: tomorrow,
        tags: ['frontend', 'responsive'],
        attachments: [],
        estimateHours: 4,
        actualHours: 3,
        createdAt: now,
        updatedAt: now,
        position: 0,
      },
      {
        id: 'task-4',
        title: 'Update documentation',
        description: 'Document new API endpoints and features',
        columnId: 'column-4',
        boardId: 'board-1',
        projectId: 'project-1',
        assigneeId: 'user-3',
        reporterId: 'user-1',
        priority: 'low',
        status: 'done',
        dueDate: now,
        tags: ['documentation'],
        attachments: [],
        estimateHours: 6,
        actualHours: 5,
        createdAt: now,
        updatedAt: now,
        position: 0,
      },
      {
        id: 'task-5',
        title: 'App store submission',
        description: 'Prepare and submit iOS app to App Store',
        columnId: 'column-5',
        boardId: 'board-2',
        projectId: 'project-2',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        priority: 'high',
        status: 'todo',
        dueDate: nextWeek,
        tags: ['ios', 'launch'],
        attachments: [],
        estimateHours: 12,
        actualHours: 0,
        createdAt: now,
        updatedAt: now,
        position: 0,
      },
    ];

    // Comments
    const comments: Comment[] = [
      {
        id: 'comment-1',
        taskId: 'task-2',
        userId: 'user-2',
        content: 'I\'ve completed the basic authentication flow. Need to add 2FA next.',
        attachments: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'comment-2',
        taskId: 'task-2',
        userId: 'user-1',
        content: 'Great progress! Please make sure to include password reset functionality as well.',
        attachments: [],
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Notifications
    const notifications: Notification[] = [
      {
        id: 'notification-1',
        userId: 'user-2',
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned to "Design homepage layout"',
        data: { taskId: 'task-1' },
        read: false,
        createdAt: now,
      },
      {
        id: 'notification-2',
        userId: 'user-3',
        type: 'task_due',
        title: 'Task Due Soon',
        message: '"Implement user authentication" is due in 2 days',
        data: { taskId: 'task-2' },
        read: true,
        createdAt: now,
      },
    ];

    // Activity Logs
    const activityLogs: ActivityLog[] = [
      {
        id: 'activity-1',
        userId: 'user-1',
        type: 'project_created',
        entityType: 'project',
        entityId: 'project-1',
        data: { projectName: 'Website Redesign' },
        createdAt: now,
      },
      {
        id: 'activity-2',
        userId: 'user-2',
        type: 'task_created',
        entityType: 'task',
        entityId: 'task-1',
        data: { taskTitle: 'Design homepage layout' },
        createdAt: now,
      },
    ];

    // Sessions
    const sessions: Session[] = [];

    return {
      users,
      tasks,
      comments,
      columns,
      boards,
      projects,
      teams,
      notifications,
      activityLogs,
      sessions,
    };
  }

  // User methods
  getUserById(id: string): User | undefined {
    return this.data.users.find(user => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(user => user.email === email);
  }

  getUsers(): User[] {
    return [...this.data.users];
  }

  // Task methods
  getTaskById(id: string): Task | undefined {
    return this.data.tasks.find(task => task.id === id);
  }

  getTasksByColumnId(columnId: string): Task[] {
    return this.data.tasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  }

  getTasksByBoardId(boardId: string): Task[] {
    return this.data.tasks.filter(task => task.boardId === boardId);
  }

  getTasksByProjectId(projectId: string): Task[] {
    return this.data.tasks.filter(task => task.projectId === projectId);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.tasks.push(newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | undefined {
    const index = this.data.tasks.findIndex(task => task.id === id);
    if (index === -1) return undefined;

    this.data.tasks[index] = {
      ...this.data.tasks[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.data.tasks[index];
  }

  deleteTask(id: string): boolean {
    const index = this.data.tasks.findIndex(task => task.id === id);
    if (index === -1) return false;
    this.data.tasks.splice(index, 1);
    return true;
  }

  moveTask(taskId: string, columnId: string, position: number): Task | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    // Update task position and column
    task.columnId = columnId;
    task.position = position;
    task.updatedAt = new Date();

    // Reorder tasks in the new column
    const columnTasks = this.getTasksByColumnId(columnId)
      .filter(t => t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    columnTasks.splice(position, 0, task);
    columnTasks.forEach((t, idx) => {
      t.position = idx;
    });

    return task;
  }

  // Column methods
  getColumnById(id: string): Column | undefined {
    return this.data.columns.find(column => column.id === id);
  }

  getColumnsByBoardId(boardId: string): Column[] {
    return this.data.columns
      .filter(column => column.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  }

  createColumn(column: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>): Column {
    const newColumn: Column = {
      ...column,
      id: `column-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.columns.push(newColumn);
    
    // Add column to board
    const board = this.getBoardById(column.boardId);
    if (board) {
      board.columns.push(newColumn.id);
      board.updatedAt = new Date();
    }
    
    return newColumn;
  }

  updateColumn(id: string, updates: Partial<Omit<Column, 'id' | 'createdAt' | 'updatedAt'>>): Column | undefined {
    const index = this.data.columns.findIndex(column => column.id === id);
    if (index === -1) return undefined;

    this.data.columns[index] = {
      ...this.data.columns[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.data.columns[index];
  }

  deleteColumn(id: string): boolean {
    const index = this.data.columns.findIndex(column => column.id === id);
    if (index === -1) return false;

    // Remove column from board
    const column = this.data.columns[index];
    const board = this.getBoardById(column.boardId);
    if (board) {
      board.columns = board.columns.filter(colId => colId !== id);
      board.updatedAt = new Date();
    }

    // Delete all tasks in this column
    this.data.tasks = this.data.tasks.filter(task => task.columnId !== id);
    
    this.data.columns.splice(index, 1);
    return true;
  }

  // Board methods
  getBoardById(id: string): Board | undefined {
    return this.data.boards.find(board => board.id === id);
  }

  getBoardsByProjectId(projectId: string): Board[] {
    return this.data.boards.filter(board => board.projectId === projectId);
  }

  createBoard(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Board {
    const newBoard: Board = {
      ...board,
      id: `board-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.boards.push(newBoard);
    
    // Add board to project
    const project = this.getProjectById(board.projectId);
    if (project) {
      project.boards.push(newBoard.id);
      project.updatedAt = new Date();
    }
    
    return newBoard;
  }

  // Project methods
  getProjectById(id: string): Project | undefined {
    return this.data.projects.find(project => project.id === id);
  }

  getProjectsByTeamId(teamId: string): Project[] {
    return this.data.projects.filter(project => project.teamId === teamId);
  }

  getProjectsByUserId(userId: string): Project[] {
    return this.data.projects.filter(project => 
      project.members.includes(userId) || project.ownerId === userId
    );
  }

  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.projects.push(newProject);
    
    // Add project to team
    const team = this.getTeamById(project.teamId);
    if (team) {
      team.projects.push(newProject.id);
      team.updatedAt = new Date();
    }
    
    return newProject;
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project | undefined {
    const index = this.data.projects.findIndex(project => project.id === id);
    if (index === -1) return undefined;

    this.data.projects[index] = {
      ...this.data.projects[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.data.projects[index];
  }

  // Team methods
  getTeamById(id: string): Team | undefined {
    return this.data.teams.find(team => team.id === id);
  }

  getTeamsByUserId(userId: string): Team[] {
    return this.data.teams.filter(team => team.members.includes(userId));
  }

  // Comment methods
  getCommentsByTaskId(taskId: string): Comment[] {
    return this.data.comments
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Comment {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.comments.push(newComment);
    return newComment;
  }

  // Notification methods
  getNotificationsByUserId(userId: string): Notification[] {
    return this.data.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUnreadNotificationsByUserId(userId: string): Notification[] {
    return this.getNotificationsByUserId(userId).filter(n => !n.read);
  }

  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}`,
      createdAt: new Date(),
    };
    this.data.notifications.push(newNotification);
    return newNotification;
  }

  markNotificationAsRead(id: string): boolean {
    const notification = this.data.notifications.find(n => n.id === id);
    if (!notification) return false;
    notification.read = true;
    return true;
  }

  markAllNotificationsAsRead(userId: string): void {
    this.data.notifications
      .filter(n => n.userId === userId && !n.read)
      .forEach(n => n.read = true);
  }

  // Activity Log methods
  getActivityLogsByUserId(userId: string): ActivityLog[] {
    return this.data.activityLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const newLog: ActivityLog = {
      ...log,
      id: `activity-${Date.now()}`,
      createdAt: new Date(),
    };
    this.data.activityLogs.push(newLog);
    return newLog;
  }

  // Session methods
  getSessionByToken(token: string): Session | undefined {
    return this.data.sessions.find(session => session.token === token);
  }

  createSession(session: Omit<Session, 'id' | 'createdAt'>): Session {
    const newSession: Session = {
      ...session,
      id: `session-${Date.now()}`,
      createdAt: new Date(),
    };
    this.data.sessions.push(newSession);
    return newSession;
  }

  deleteSession(id: string): boolean {
    const index = this.data.sessions.findIndex(session => session.id === id);
    if (index === -1) return false;
    this.data.sessions.splice(index, 1);
    return true;
  }

  deleteExpiredSessions(): void {
    const now = new Date();
    this.data.sessions = this.data.sessions.filter(session => session.expiresAt > now);
  }

  // Utility methods
  getData(): StoreData {
    return this.data;
  }

  reset(): void {
    this.data = this.initializeData();
  }
}

export { InMemoryStore };