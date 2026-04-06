import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import Link from 'next/link';
import { CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const user = await getCurrentUser();
  const invite = store.invites.findByToken(token);

  if (!invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Invite Not Found
            </h2>
            <p className="mt-2 text-gray-600">
              This invite link is invalid or has expired.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Return to home →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const workspace = store.workspaces.findById(invite.workspaceId);
  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Workspace Not Found
            </h2>
            <p className="mt-2 text-gray-600">
              The workspace associated with this invite no longer exists.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inviter = store.users.findById(invite.invitedBy);
  const isExpired = invite.expiresAt < Date.now();

  if (isExpired) {
    store.invites.delete(invite.id);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Invite Expired
            </h2>
            <p className="mt-2 text-gray-600">
              This invite link has expired. Please ask for a new invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if already a member
  const isAlreadyMember = user
    ? store.workspaceMembers
        .findByWorkspaceId(workspace.id)
        .some(member => member.userId === user.id)
    : false;

  if (isAlreadyMember) {
    redirect(`/workspace/${workspace.id}`);
  }

  const handleAccept = async () => {
    'use server';
    
    if (!user) {
      redirect(`/login?redirect=/invite/${token}`);
    }

    const response = await fetch(`/api/invites/${token}/accept`, {
      method: 'POST',
    });

    if (response.ok) {
      redirect(`/workspace/${workspace.id}`);
    } else {
      const data = await response.json();
      throw new Error(data.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <CheckBadgeIcon className="mx-auto h-12 w-12 text-green-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            You&apos;re Invited!
          </h2>
          <p className="mt-2 text-gray-600">
            You&apos;ve been invited to join{' '}
            <span className="font-semibold">{workspace.name}</span>
          </p>
          
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {inviter?.name || 'Unknown user'}
                </p>
                <p className="text-sm text-gray-500">
                  {inviter?.email || 'Unknown email'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Invited you as a{' '}
              <span className="font-medium capitalize">{invite.role}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Invite expires: {new Date(invite.expiresAt).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {user ? (
              <>
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    You&apos;re logged in as <strong>{user.email}</strong>
                  </p>
                </div>
                <form action={handleAccept}>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Accept Invite
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  To accept this invite, you need to login or create an account.
                </p>
                <div className="space-y-3">
                  <Link
                    href={`/login?redirect=/invite/${token}`}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/register?redirect=/invite/${token}`}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Create Account
                  </Link>
                </div>
              </>
            )}
            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Return to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}