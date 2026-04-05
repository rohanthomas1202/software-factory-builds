import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Project, UserRole } from '@/lib/types';

const store = InMemoryStore.getInstance();

interface RouteParams {
  params: {
    projectId: string;
  };
}

// GET /api/projects/[projectId] - Get project details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;
    const project = store.getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    const hasAccess = store.hasProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Get project members
    const members = store.getProjectMembers(projectId);
    
    // Get project boards
    const boards = store.getBoardsForProject(projectId);
    
    // Get recent activity
    const activity = store.getActivityLogsForProject(projectId, 10);

    return NextResponse.json({
      project,
      members,
      boards,
      activity,
      userRole: store.getProjectMemberRole(projectId, user.id),
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectId] - Update project
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;
    const project = store.getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has admin access to the project
    const userRole = store.getProjectMemberRole(projectId, user.id);
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only project admins can update the project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color, isPublic, archived } = body;

    // Validate at least one field is provided
    if (!name && !description && !color && isPublic === undefined && archived === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<Project> = {};
    
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Project name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }
    
    if (color !== undefined) {
      updateData.color = color;
    }
    
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }
    
    if (archived !== undefined) {
      updateData.archived = archived;
    }

    // Update the project
    const updatedProject = store.updateProject(projectId, updateData);

    // Log activity
    store.createActivityLog({
      type: 'project_updated',
      userId: user.id,
      projectId: projectId,
      metadata: { 
        updatedFields: Object.keys(updateData),
        projectName: updatedProject.name 
      },
    });

    return NextResponse.json({
      project: updatedProject,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;
    const project = store.getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has admin access to the project
    const userRole = store.getProjectMemberRole(projectId, user.id);
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only project admins can delete the project' },
        { status: 403 }
      );
    }

    // Archive the project instead of hard delete
    const archivedProject = store.updateProject(projectId, { archived: true });

    // Log activity
    store.createActivityLog({
      type: 'project_archived',
      userId: user.id,
      projectId: projectId,
      metadata: { projectName: archivedProject.name },
    });

    return NextResponse.json({
      message: 'Project archived successfully',
      project: archivedProject
    });
  } catch (error) {
    console.error('Error archiving project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}