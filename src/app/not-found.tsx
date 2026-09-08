import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-[0.85rem] font-bold text-neutral-text2 tracking-wide">MORFIT</p>
      <h1 className="mt-2 text-[1.8rem] font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-neutral-text2">주소가 바뀌었거나 아직 준비 중인 화면입니다.</p>
      <div className="mt-6 flex gap-2"><Link href="/" className="h-11 px-5 rounded-xl bg-brand-black text-white font-semibold inline-flex items-center">홈으로</Link><Link href="/ax" className="h-11 px-5 rounded-xl border border-neutral-border font-semibold inline-flex items-center">Business AX</Link></div>
    </div>
  );
}
