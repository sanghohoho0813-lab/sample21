"use client";
import type { ReactNode } from "react";
import { useHydrated } from "./hooks";
import { SkeletonCard } from "@/components/ui/States";

/** Renders skeleton until the persisted demo store is ready (prevents hydration mismatch). */
export function Hydrated({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const ok = useHydrated();
  if (!ok) return <>{fallback ?? <div className="space-y-4 animate-fadeIn"><SkeletonCard /><SkeletonCard lines={5} /></div>}</>;
  return <>{children}</>;
}
