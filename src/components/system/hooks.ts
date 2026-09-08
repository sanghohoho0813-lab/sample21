"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

/** true once zustand persist has rehydrated on the client. */
export function useHydrated() {
  const hydrated = useApp((s) => s.hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted && hydrated;
}

/** true when rendered inside the Device Preview iframe → hide preview triggers (no recursion). */
export function useIsPreviewFrame() {
  const [inFrame, setInFrame] = useState(false);
  useEffect(() => { try { setInFrame(window.self !== window.top); } catch { setInFrame(true); } }, []);
  return inFrame;
}

export function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const on = () => setM(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);
  return m;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}
