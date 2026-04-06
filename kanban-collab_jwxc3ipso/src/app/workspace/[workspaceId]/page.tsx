import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { WorkspaceHeader } from '@/components/WorkspaceHeader';
import { ProjectCard } from '@/components/ProjectCard';
import { MemberList } from '@/components/MemberList';
import { CreateProjectForm } from '@/components/CreateProjectForm';

interface WorkspacePageProps {
  params: {
    workspaceId: string;
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const { workspaceId } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workspaces/${workspaceId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Workspace not found</h1>
              <p className="mt-2 text-gray-600">The workspace you're looking for doesn't exist or you don't have access.</p>
              <Link
                href="/"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Go to home
              </Link>
            </div>
          </div>
        );
      }
      throw new Error('Failed to fetch workspace');
    }

    const { data } = await response.json();
    const { workspace, members, projects } = data;

    const isOwner = workspace.ownerId === currentUser.id;

    return (
      <div className="min-h-screen bg-gray-50">
        <WorkspaceHeader 
          workspace={workspace} 
          isOwner={isOwner}
          currentUser={currentUser}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column: Projects */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                {isOwner && (
                  <CreateProjectForm workspaceId={workspaceId} />
                )}
              </div>
              
              {projects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                  <p className="text-gray-500 mb-6">Create your first project to start organizing work</p>
                  {isOwner && (
                    <CreateProjectForm workspaceId={workspaceId} variant="button" />
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      workspaceId={workspaceId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right column: Members */}
            <div className="lg:col-span-1">
              <MemberList 
                members={members} 
                workspaceId={workspaceId}
                isOwner={isOwner}
                currentUserId={currentUser.id}
              />
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error loading workspace:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error loading workspace</h1>
          <p className="mt-2 text-gray-600">Something went wrong. Please try again later.</p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to home
          </Link>
        </div>
      </div>
    );
  }
}