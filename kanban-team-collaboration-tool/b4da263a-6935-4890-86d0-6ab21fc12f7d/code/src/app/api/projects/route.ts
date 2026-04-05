import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Project, UserRole } from '@/lib/types';

const store = InMemoryStore.getInstance();

// GET /api/projects - Get all projects for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let projects = store.getProjectsForUser(user.id);

    // Filter by team if specified
    if (teamId) {
      projects = projects.filter(project => project.teamId === teamId);
    }

    // Filter out archived projects unless explicitly included
    if (!includeArchived) {
      projects = projects.filter(project => !project.archived);
    }

    // Sort by last activity (most recent first)
    projects.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, teamId, color, isPublic } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the team
    const team = store.getTeam(teamId);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const teamMember = team.members.find(member => member.userId === user.id);
    if (!teamMember) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 }
      );
    }

    // Only team admins can create projects
    if (teamMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only team admins can create projects' },
        { status: 403 }
      );
    }

    // Create the project
    const project = store.createProject({
      name: name.trim(),
      description: description?.trim() || '',
      teamId,
      color: color || '#3B82F6',
      isPublic: isPublic || false,
      createdBy: user.id,
    });

    // Add creator as project admin
    store.addProjectMember(project.id, user.id, 'admin');

    // Create default board for the project
    const defaultBoard = store.createBoard({
      name: 'Default Board',
      projectId: project.id,
      createdBy: user.id,
      description: 'Main board for project tasks',
    });

    // Create default columns for the board
    const defaultColumns = [
      { name: 'To Do', color: '#6B7280', order: 0 },
      { name: 'In Progress', color: '#3B82F6', order: 1 },
      { name: 'Review', color: '#F59E0B', order: 2 },
      { name: 'Done', color: '#10B981', order: 3 },
    ];

    defaultColumns.forEach(column => {
      store.createColumn({
        name: column.name,
        boardId: defaultBoard.id,
        color: column.color,
        order: column.order,
        createdBy: user.id,
      });
    });

    // Log activity
    store.createActivityLog({
      type: 'project_created',
      userId: user.id,
      projectId: project.id,
      metadata: { projectName: project.name },
    });

    return NextResponse.json(
      { 
        project,
        message: 'Project created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}