"use client";
import { RouteError } from "@/components/system/RouteError";

export default function AxError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} homeHref="/ax" homeLabel="대시보드로" />;
}
