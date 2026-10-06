import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "페이지를 찾을 수 없음" };

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[0.85rem] font-bold tracking-wide text-neutral-text2">MORFIT</p>
      <h1 className="mt-2 text-[1.8rem] font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-neutral-text2">주소가 바뀌었거나 아직 준비 중인 화면입니다.</p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl bg-brand-black px-5 font-semibold text-white"
        >
          홈으로
        </Link>
        <Link
          href="/ax"
          className="inline-flex h-11 items-center rounded-xl border border-neutral-border px-5 font-semibold"
        >
          AX 운영화면
        </Link>
      </div>
    </main>
  );
}
