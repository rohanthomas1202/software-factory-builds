import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

export default async function HomePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Find user's workspaces
  const members = Array.from(store.workspaceMembers.values()).filter(
    (member) => member.userId === user.id
  );
  
  if (members.length === 0) {
    // User has no workspaces, redirect to create workspace page (future feature)
    // For now, redirect to a welcome page or show empty state
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Kanban Collab
            </h1>
            <p className="text-gray-600 mb-8">
              You don't have any workspaces yet. Create your first workspace to get started.
            </p>
            <a
              href="/api/workspaces"
              method="POST"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Workspace
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get the first workspace
  const firstWorkspaceId = members[0].workspaceId;
  const workspace = store.workspaces.get(firstWorkspaceId);
  
  if (!workspace) {
    // Workspace not found, redirect to login
    redirect('/login');
  }

  // Redirect to the first workspace
  redirect(`/workspace/${workspace.id}`);
}