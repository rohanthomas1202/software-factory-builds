"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Workspace } from "@/lib/types";
import NotificationBell from "@/components/NotificationBell";
import { getCurrentUser } from "@/lib/auth";
import { findWorkspacesByUserId } from "@/lib/store";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        if (user) {
          const userWorkspaces = findWorkspacesByUserId(user.id);
          setWorkspaces(userWorkspaces);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  if (isLoading) {
    return (
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={currentUser ? "/dashboard" : "/"}
              className="flex items-center space-x-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                KanbanCollab
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          {currentUser && (
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link
                href="/dashboard"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Dashboard
              </Link>
              {workspaces.length > 0 && (
                <Link
                  href={`/workspace/${workspaces[0].id}`}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/workspace")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  My Workspace
                </Link>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Workspace Switcher */}
                {workspaces.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <svg
                        className="h-5 w-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>Workspaces</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isWorkspaceMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsWorkspaceMenuOpen(false)}
                        />
                        <div className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                          <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                            Your Workspaces
                          </div>
                          {workspaces.map((workspace) => (
                            <Link
                              key={workspace.id}
                              href={`/workspace/${workspace.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsWorkspaceMenuOpen(false)}
                            >
                              {workspace.name}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100">
                            <Link
                              href="/dashboard"
                              className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                              onClick={() => setIsWorkspaceMenuOpen(false)}
                            >
                              Create new workspace
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Notification Bell */}
                <div className="relative">
                  <NotificationBell />
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="hidden text-sm font-medium text-gray-700 md:inline">
                      {currentUser.name}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2">
                          <p className="text-sm font-medium text-gray-900">
                            {currentUser.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {currentUser.email}
                          </p>
                        </div>
                        <div className="border-t border-gray-100">
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}