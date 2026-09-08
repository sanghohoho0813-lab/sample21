"use client";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { Toaster } from "@/components/ui/Toast";
import { PresentationController } from "@/components/system/Presentation";

/** Applies theme / font / motion attributes to <html>, hosts global overlays. */
export function AppProviders({ children }: { children: ReactNode }) {
  const theme = useApp((s) => s.theme);
  const fontScale = useApp((s) => s.fontScale);
  const reducedMotion = useApp((s) => s.reducedMotion);
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    html.setAttribute("data-font", fontScale);
    const prefers = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    html.setAttribute("data-motion", reducedMotion || prefers ? "reduced" : "normal");
  }, [theme, fontScale, reducedMotion]);
  return (
    <>
      {children}
      <Toaster />
      <PresentationController />
    </>
  );
}

/** Marks which surface is active (affects root font-size per Unified Executive Readability). */
export function SurfaceMarker({ surface }: { surface: "customer" | "ax" }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-surface", surface);
    return () => document.documentElement.removeAttribute("data-surface");
  }, [surface]);
  return null;
}
