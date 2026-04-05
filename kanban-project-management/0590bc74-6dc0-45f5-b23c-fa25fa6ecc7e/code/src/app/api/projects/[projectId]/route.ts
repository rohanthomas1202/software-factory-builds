/**
 * Project API Routes
 * GET /api/projects/[projectId] - Get project details
 * PUT /api/projects/[projectId] - Update project
 * DELETE /api/projects/[projectId] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Project } from '@/lib/types';

interface RouteParams {
  params: {
    projectId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { projectId } = params;
    const project = store.projects.get(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    if (project.ownerId !== user.id && !project.memberIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get project boards
    const boards = Array.from(store.boards.values())
      .filter(board => board.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Get team members
    const teamMembers = Array.from(store.users.values())
      .filter(user => project.memberIds.includes(user.id));

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        boards,
        teamMembers
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { projectId } = params;
    const project = store.projects.get(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner (only owners can update)
    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only project owners can update projects' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color } = body;

    // Validate input
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
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
    }

    if (description !== undefined && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Update project
    const updatedProject: Project = {
      ...project,
      name: name?.trim() || project.name,
      description: description?.trim() || project.description,
      color: color || project.color,
      updatedAt: new Date()
    };

    store.projects.set(projectId, updatedProject);

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { projectId } = params;
    const project = store.projects.get(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner (only owners can delete)
    if (project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only project owners can delete projects' },
        { status: 403 }
      );
    }

    // Get all boards for this project
    const projectBoards = Array.from(store.boards.values())
      .filter(board => board.projectId === projectId);

    // Delete all related data
    projectBoards.forEach(board => {
      // Delete columns for this board
      board.columnIds.forEach(columnId => {
        const column = store.columns.get(columnId);
        if (column) {
          // Delete tasks for this column
          column.taskIds.forEach(taskId => {
            const task = store.tasks.get(taskId);
            if (task) {
              // Delete comments for this task
              task.commentIds.forEach(commentId => {
                store.comments.delete(commentId);
              });
              store.tasks.delete(taskId);
            }
          });
          store.columns.delete(columnId);
        }
      });
      store.boards.delete(board.id);
    });

    // Delete the project
    store.projects.delete(projectId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}