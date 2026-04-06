'use client';

import { useState } from 'react';
import { InviteMemberModal } from './InviteMemberModal';

interface Member {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  } | null;
}

interface MemberListProps {
  members: Member[];
  workspaceId: string;
  isOwner: boolean;
  currentUserId: string;
}

export function MemberList({ members, workspaceId, isOwner, currentUserId }: MemberListProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (a.role !== 'owner' && b.role === 'owner') return 1;
    return a.joinedAt - b.joinedAt;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Members ({members.length})</h3>
        {isOwner && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sortedMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {member.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {member.user?.name || 'Unknown user'}
                  {member.userId === currentUserId && (
                    <span className="ml-2 text-xs text-gray-500">(You)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{member.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs rounded-full ${
                member.role === 'owner'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {member.role}
              </span>
              {member.userId !== currentUserId && isOwner && (
                <button
                  onClick={async () => {
                    if (confirm(`Remove ${member.user?.name} from workspace?`)) {
                      try {
                        const response = await fetch(`/api/workspaces/${workspaceId}/members/${member.userId}`, {
                          method: 'DELETE',
                        });
                        if (response.ok) {
                          window.location.reload();
                        }
                      } catch (error) {
                        console.error('Failed to remove member:', error);
                      }
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Remove member"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          <p className="mb-2">Workspace members can:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>View and create projects</li>
            <li>Create and edit boards</li>
            <li>Comment on cards</li>
          </ul>
          <p className="mt-3">
            Owners can also manage members and workspace settings.
          </p>
        </div>
      </div>

      <InviteMemberModal
        workspaceId={workspaceId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={() => {
          // Refresh the page to show new member
          window.location.reload();
        }}
      />
    </div>
  );
}