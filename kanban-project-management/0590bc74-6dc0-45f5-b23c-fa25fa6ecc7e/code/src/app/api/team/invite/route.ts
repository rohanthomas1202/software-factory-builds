/**
 * Team Invitation API Routes
 * POST /api/team/invite - Send team invitation email
 * GET /api/team/invite/[token] - Validate invitation token
 * POST /api/team/invite/[token]/accept - Accept invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { TeamInvitation, UserRole } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Mock email sending function
async function sendInvitationEmail(email: string, projectName: string, inviterName: string, token: string) {
  console.log(`[Mock Email] Invitation sent to ${email} for project "${projectName}" from ${inviterName}`);
  console.log(`[Mock Email] Invitation link: /api/team/invite/${token}`);
  return true;
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
    const { projectId, email, role = 'member' } = body;

    if (!projectId || !email) {
      return NextResponse.json(
        { error: 'projectId and email are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
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
        { error: 'Only project owners or admins can send invitations' },
        { status: 403 }
      );
    }

    // Check if user with this email exists
    const existingUser = store.getUserByEmail(email);
    if (existingUser) {
      // Check if user is already a team member
      if (project.teamMembers.includes(existingUser.id) || project.ownerId === existingUser.id) {
        return NextResponse.json(
          { error: 'User is already a team member' },
          { status: 400 }
        );
      }
    }

    // Create invitation token
    const token = uuidv4();
    const invitation: TeamInvitation = {
      id: uuidv4(),
      token,
      email,
      projectId,
      role: role as UserRole,
      inviterId: user.id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.createTeamInvitation(invitation);

    // Send invitation email (mock)
    await sendInvitationEmail(email, project.name, user.name, token);

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        token,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const invitation = store.getTeamInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation is already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    const project = store.getProject(invitation.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const inviter = store.getUser(invitation.inviterId);
    if (!inviter) {
      return NextResponse.json(
        { error: 'Inviter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          ...invitation,
          projectName: project.name,
          inviterName: inviter.name,
        },
      },
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const invitation = store.getTeamInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation is already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    // Check if email matches (if invitation was sent to specific email)
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    const project = store.getProject(invitation.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is already a team member
    if (project.teamMembers.includes(user.id) || project.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You are already a team member of this project' },
        { status: 400 }
      );
    }

    // Add user to project team
    project.teamMembers.push(user.id);
    store.updateProject(invitation.projectId, project);

    // Update invitation status
    invitation.status = 'accepted';
    invitation.updatedAt = new Date();
    store.updateTeamInvitation(invitation.id, invitation);

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        projectId: project.id,
        projectName: project.name,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}