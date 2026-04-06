"use client";

import { User } from "@/lib/types";
import { createContext, useContext } from "react";

interface AppContextType {
  user: User | null;
}

const AppContext = createContext<AppContextType>({ user: null });

export function Providers({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  return (
    <AppContext.Provider value={{ user }}>{children}</AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a Providers");
  }
  return context;
}