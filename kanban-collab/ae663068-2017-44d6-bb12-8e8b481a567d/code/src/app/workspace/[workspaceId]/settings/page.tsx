'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Mail, User, X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Invite, WorkspaceMember, User as UserType } from '@/lib/types';

interface WorkspaceSettingsPageProps {
  params: {
    workspaceId: string;
  };
}

export default function WorkspaceSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const workspaceId = params.workspaceId;

  const [workspace, setWorkspace] = useState<{ name: string; description: string } | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [users, setUsers] = useState<Record<string, UserType>>({});
  
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'owner'>('member');
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({});

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      
      const [workspaceRes, membersRes, invitesRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}`),
        fetch(`/api/workspaces/${workspaceId}/members`),
        fetch(`/api/workspaces/${workspaceId}/invites`),
      ]);

      if (!workspaceRes.ok) {
        throw new Error('Failed to load workspace');
      }

      const workspaceData = await workspaceRes.json();
      setWorkspace(workspaceData.data);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data);
        
        const userIds = membersData.data.map((m: WorkspaceMember) => m.userId);
        if (userIds.length > 0) {
          const usersRes = await fetch('/api/users/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds }),
          });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData.data);
          }
        }
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData.data.filter((invite: Invite) => !invite.acceptedAt));
      }
    } catch (error) {
      console.error('Error loading workspace data:', error);
      toast({
        message: 'Failed to load workspace settings',
        type: 'error',
      });
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!inviteEmail.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    try {
      setInviteLoading(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      toast({
        message: `Invite sent to ${inviteEmail}`,
        type: 'success',
      });

      setInviteEmail('');
      setInviteRole('member');
      loadWorkspaceData();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        message: error instanceof Error ? error.message : 'Failed to send invite',
        type: 'error',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      setRevokeLoading(inviteId);
      const response = await fetch(`/api/workspaces/${workspaceId}/invites/${inviteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke invite');
      }

      toast({
        message: 'Invite revoked successfully',
        type: 'success',
      });

      setInvites(invites.filter(invite => invite.id !== inviteId));
    } catch (error) {
      console.error('Error revoking invite:', error);
      toast({
        message: error instanceof Error ? error.message : 'Failed to revoke invite',
        type: 'error',
      });
    } finally {
      setRevokeLoading(null);
    }
  };

  const getMemberName = (userId: string) => {
    return users[userId]?.name || 'Unknown User';
  };

  const getMemberEmail = (userId: string) => {
    return users[userId]?.email || 'Unknown Email';
  };

  const getMemberAvatar = (userId: string) => {
    return users[userId]?.avatarUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Workspace not found</h2>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{workspace.name} Settings</h1>
        <p className="text-gray-600 mt-2">{workspace.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Workspace Members</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {getMemberAvatar(member.userId) ? (
                        <img
                          src={getMemberAvatar(member.userId)}
                          alt={getMemberName(member.userId)}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getMemberName(member.userId)}</p>
                      <p className="text-sm text-gray-500">{getMemberEmail(member.userId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'owner'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
              
              {members.length === 0 && (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No members yet</p>
                  <p className="text-sm text-gray-400 mt-1">Invite people to collaborate</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Pending Invites</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {invites.length} pending
              </span>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="text-sm text-gray-500">
                        Invited {new Date(invite.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invite.role === 'owner'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invite.role}
                    </span>
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      disabled={revokeLoading === invite.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      {revokeLoading === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              
              {invites.length === 0 && (
                <div className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending invites</p>
                  <p className="text-sm text-gray-400 mt-1">Invite people to join</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite New Member</h2>
            
            <form onSubmit={handleSendInvite}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="colleague@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="member"
                        checked={inviteRole === 'member'}
                        onChange={() => setInviteRole('member')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Member</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="owner"
                        checked={inviteRole === 'owner'}
                        onChange={() => setInviteRole('owner')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Owner</span>
                    </label>
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending Invite...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Member:</strong> Can create boards, manage cards, and invite others.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <strong>Owner:</strong> Has all permissions plus can manage workspace settings and delete the workspace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}