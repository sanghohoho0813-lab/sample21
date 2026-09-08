import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto px-4", wide ? "max-w-[1400px]" : "max-w-[1280px]", className)}>{children}</div>;
}

export function SectionHead({ title, desc, more, moreLabel = "더보기", className, tour }: { title: ReactNode; desc?: ReactNode; more?: string; moreLabel?: string; className?: string; tour?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-3 mb-4 md:mb-5", className)} data-tour={tour}>
      <div>
        <h2 className="text-[1.3rem] md:text-[1.6rem] font-bold tracking-tight leading-tight">{title}</h2>
        {desc && <p className="mt-1 text-neutral-text2 text-[0.9rem] md:text-[0.95rem]">{desc}</p>}
      </div>
      {more && <Link href={more} className="shrink-0 inline-flex items-center gap-0.5 text-[0.9rem] font-semibold text-neutral-text2 hover:text-neutral-text">{moreLabel}<ChevronRight size={16} /></Link>}
    </div>
  );
}

export function PageTitle({ title, desc, right, className }: { title: ReactNode; desc?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-8", className)}>
      <div><h1 className="text-[1.7rem] md:text-[2.2rem] font-bold tracking-tight leading-tight">{title}</h1>{desc && <p className="mt-1.5 text-neutral-text2 text-[0.95rem] md:text-[1rem]">{desc}</p>}</div>
      {right}
    </div>
  );
}
