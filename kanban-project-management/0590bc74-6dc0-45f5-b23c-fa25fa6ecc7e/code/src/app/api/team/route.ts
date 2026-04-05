/**
 * Team API Routes
 * GET /api/team - List team members for a project
 * POST /api/team - Add team member to project
 * DELETE /api/team - Remove team member from project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { User, UserRole, Project } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const project = store.getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this project
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all team members (including owner)
    const teamMembers: User[] = [];
    
    // Add owner
    const owner = store.getUser(project.ownerId);
    if (owner) {
      teamMembers.push(owner);
    }

    // Add other team members
    for (const memberId of project.teamMembers) {
      if (memberId !== project.ownerId) {
        const member = store.getUser(memberId);
        if (member) {
          teamMembers.push(member);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, userId, role } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'projectId and userId are required' },
        { status: 400 }
      );
    }

    const project = store.getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if current user is project owner or admin
    if (project.ownerId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only project owners or admins can add team members' },
        { status: 403 }
      );
    }

    const userToAdd = store.getUser(userId);
    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a team member
    if (project.teamMembers.includes(userId) || project.ownerId === userId) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Add user to team
    project.teamMembers.push(userId);
    store.updateProject(projectId, project);

    return NextResponse.json({
      success: true,
      message: 'Team member added successfully',
      data: userToAdd,
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'projectId and userId query parameters are required' },
        { status: 400 }
      );
    }

    const project = store.getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if current user is project owner or admin
    if (project.ownerId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only project owners or admins can remove team members' },
        { status: 403 }
      );
    }

    // Cannot remove owner
    if (project.ownerId === userId) {
      return NextResponse.json(
        { error: 'Cannot remove project owner' },
        { status: 400 }
      );
    }

    // Check if user is a team member
    const memberIndex = project.teamMembers.indexOf(userId);
    if (memberIndex === -1) {
      return NextResponse.json(
        { error: 'User is not a team member' },
        { status: 400 }
      );
    }

    // Remove user from team
    project.teamMembers.splice(memberIndex, 1);
    store.updateProject(projectId, project);

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}