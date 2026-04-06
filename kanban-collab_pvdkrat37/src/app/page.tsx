import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  // If user is logged in, redirect to dashboard
  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <div className="relative overflow-hidden">
      {/* Hero section */}
      <div className="relative bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-24 lg:pb-32">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Project Management</span>
                <span className="block text-blue-600">Made Simple</span>
              </h1>
              <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
                KanbanCollab brings teams together with intuitive kanban boards,
                real-time collaboration, and powerful project tracking tools.
                Everything you need to manage projects effectively.
              </p>
              <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                  <Link
                    href="/register"
                    className="flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 sm:px-8"
                  >
                    Get started free
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center rounded-md border border-transparent bg-blue-100 px-4 py-3 text-base font-medium text-blue-700 hover:bg-blue-200 sm:px-8"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything your team needs
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-500">
              Built with modern teams in mind, KanbanCollab provides all the
              tools for seamless project collaboration.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="relative rounded-lg bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-500 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">
                  Drag & Drop Kanban
                </h3>
                <p className="mt-2 text-gray-500">
                  Move tasks effortlessly between columns. Intuitive drag-and-drop
                  interface with real-time updates for your entire team.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative rounded-lg bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">
                  Team Collaboration
                </h3>
                <p className="mt-2 text-gray-500">
                  Invite team members, assign tasks, add comments, and keep
                  everyone in sync with in-app notifications.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative rounded-lg bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-purple-500 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">
                  Real-time Updates
                </h3>
                <p className="mt-2 text-gray-500">
                  See changes as they happen. Card movements, edits, and comments
                  appear instantly for all team members.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 md:p-12 lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-0 lg:flex-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Ready to get started?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-blue-100">
                Join thousands of teams who use KanbanCollab to manage their
                projects more effectively.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:ml-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-blue-600 shadow-sm hover:bg-blue-50"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}