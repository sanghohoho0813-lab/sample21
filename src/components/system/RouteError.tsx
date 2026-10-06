"use client";
/* 라우트 오류 경계에서 보여주는 화면 — 셸(헤더·메뉴)은 그대로 두고 본문만 바꾼다.
   사용자는 '다시 시도'로 같은 화면을 다시 그리거나 안전한 화면으로 이동할 수 있고,
   개발자는 콘솔 로그와 오류 코드(digest)로 서버 로그를 찾아갈 수 있다. */
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RouteError({ error, reset, homeHref, homeLabel }: { error: Error & { digest?: string }; reset: () => void; homeHref: string; homeLabel: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="mx-auto max-w-md px-6 py-20 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-semantic-error/10 text-semantic-error inline-flex items-center justify-center"><AlertTriangle size={22} /></div>
      <h1 className="text-[1.4rem] font-bold">화면을 불러오지 못했습니다</h1>
      <p className="mt-2 text-neutral-text2">일시적인 문제일 수 있어요. 다시 시도해도 같으면 다른 화면에서 이어서 진행해 주세요.</p>
      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
        <Button variant="brand" onClick={reset} icon={<RotateCcw size={16} />}>다시 시도</Button>
        <Button variant="outline" href={homeHref}>{homeLabel}</Button>
      </div>
      {error.digest && <p className="mt-6 text-[0.8rem] text-neutral-text2 tabular">오류 코드 {error.digest}</p>}
    </div>
  );
}
