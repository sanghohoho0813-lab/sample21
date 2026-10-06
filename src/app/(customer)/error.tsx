"use client";
import { RouteError } from "@/components/system/RouteError";

export default function CustomerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} homeHref="/" homeLabel="홈으로" />;
}
