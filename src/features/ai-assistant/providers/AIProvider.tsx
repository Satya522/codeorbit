"use client";
import { createContext, useContext, ReactNode, useState } from "react";
const AIContext = createContext<unknown>(null);
export function AIProvider({ children }: { children: ReactNode }) {
  const [session] = useState("initialized");
  return <AIContext.Provider value={{ session }}>{children}</AIContext.Provider>;
}
export const useAI = () => useContext(AIContext);
