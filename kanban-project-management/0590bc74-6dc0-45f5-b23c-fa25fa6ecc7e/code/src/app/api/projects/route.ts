/**
 * Projects API Routes
 * GET /api/projects - List projects for current user
 * POST /api/projects - Create new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Project } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all projects where user is owner or member
    const allProjects = Array.from(store.projects.values());
    const userProjects = allProjects.filter(project => 
      project.ownerId === user.id || 
      project.memberIds.includes(user.id)
    );

    // Sort by updatedAt descending
    const sortedProjects = userProjects.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedProjects,
      count: sortedProjects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, color } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Project name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Create project
    const projectId = uuidv4();
    const now = new Date();
    
    const project: Project = {
      id: projectId,
      name: name.trim(),
      description: description?.trim() || '',
      ownerId: user.id,
      memberIds: [user.id], // Owner is automatically a member
      color: color || 'blue',
      createdAt: now,
      updatedAt: now
    };

    // Save to store
    store.projects.set(projectId, project);

    // Create default board for the project
    const boardId = uuidv4();
    const board = {
      id: boardId,
      name: 'Main Board',
      description: 'Default board for the project',
      projectId: projectId,
      columnIds: [],
      createdAt: now,
      updatedAt: now
    };
    store.boards.set(boardId, board);

    // Create default columns
    const defaultColumns = [
      { name: 'Backlog', color: 'gray' },
      { name: 'To Do', color: 'blue' },
      { name: 'In Progress', color: 'yellow' },
      { name: 'Review', color: 'purple' },
      { name: 'Done', color: 'green' }
    ];

    const columnIds: string[] = [];
    defaultColumns.forEach((col, index) => {
      const columnId = uuidv4();
      const column = {
        id: columnId,
        name: col.name,
        color: col.color,
        boardId: boardId,
        taskIds: [],
        order: index,
        createdAt: now,
        updatedAt: now
      };
      store.columns.set(columnId, column);
      columnIds.push(columnId);
    });

    // Update board with column IDs
    board.columnIds = columnIds;
    store.boards.set(boardId, board);

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}