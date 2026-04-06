/**
 * Seed database with initial demo data
 */

import { generateId } from './store';
import {
  createUser,
  createWorkspace,
  createWorkspaceMember,
  createBoard,
  createColumn,
  createCard,
  createComment,
} from './store';
import { hashPassword } from './auth';

export function seedDatabase(): void {
  console.log('Seeding database...');

  // Clear existing data (in-memory stores will be cleared on server restart)

  // Create demo users
  const user1 = createUser({
    email: 'alice@example.com',
    password: 'password123', // In production, this would be hashed
    name: 'Alice Johnson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    emailVerified: true,
  });

  const user2 = createUser({
    email: 'bob@example.com',
    password: 'password123',
    name: 'Bob Smith',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    emailVerified: true,
  });

  const user3 = createUser({
    email: 'charlie@example.com',
    password: 'password123',
    name: 'Charlie Davis',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    emailVerified: true,
  });

  // Create workspace
  const workspace = createWorkspace({
    name: 'Product Launch',
    description: 'Planning and executing our Q2 product launch',
  });

  // Add users to workspace
  const member1 = createWorkspaceMember({
    workspaceId: workspace.id,
    userId: user1.id,
    role: 'owner',
  });

  const member2 = createWorkspaceMember({
    workspaceId: workspace.id,
    userId: user2.id,
    role: 'member',
  });

  const member3 = createWorkspaceMember({
    workspaceId: workspace.id,
    userId: user3.id,
    role: 'member',
  });

  // Create board
  const board = createBoard({
    workspaceId: workspace.id,
    name: 'Launch Roadmap',
    description: 'Track all tasks for the product launch',
  });

  // Create columns
  const todoColumn = createColumn({
    boardId: board.id,
    name: 'To Do',
    rank: 0,
  });

  const progressColumn = createColumn({
    boardId: board.id,
    name: 'In Progress',
    rank: 1,
  });

  const doneColumn = createColumn({
    boardId: board.id,
    name: 'Done',
    rank: 2,
  });

  // Create cards
  const card1 = createCard({
    columnId: todoColumn.id,
    title: 'Design homepage mockup',
    description: 'Create initial design mockups for the new homepage',
    rank: 0,
    createdBy: user1.id,
    assignedTo: user2.id,
    dueDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
  });

  const card2 = createCard({
    columnId: todoColumn.id,
    title: 'Set up analytics',
    description: 'Configure Google Analytics and tracking events',
    rank: 1,
    createdBy: user2.id,
    assignedTo: user3.id,
    dueDate: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days from now
  });

  const card3 = createCard({
    columnId: progressColumn.id,
    title: 'Develop user authentication',
    description: 'Implement login, registration, and session management',
    rank: 0,
    createdBy: user3.id,
    assignedTo: user1.id,
    dueDate: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
  });

  const card4 = createCard({
    columnId: doneColumn.id,
    title: 'Project kickoff meeting',
    description: 'Hold initial project kickoff with all stakeholders',
    rank: 0,
    createdBy: user1.id,
    assignedTo: user1.id,
    dueDate: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  });

  // Create comments
  createComment({
    cardId: card1.id,
    userId: user2.id,
    content: 'Can we use the existing design system for this?',
  });

  createComment({
    cardId: card1.id,
    userId: user1.id,
    content: 'Yes, please follow the design system guidelines.',
  });

  createComment({
    cardId: card3.id,
    userId: user3.id,
    content: 'Authentication is 80% complete. Need to add email verification.',
  });

  console.log('Seed completed successfully!');
  console.log('Demo users created:', [user1.email, user2.email, user3.email]);
  console.log('Workspace:', workspace.name);
  console.log('Board:', board.name);
  console.log('Columns:', [todoColumn.name, progressColumn.name, doneColumn.name]);
  console.log('Cards created:', 4);
}