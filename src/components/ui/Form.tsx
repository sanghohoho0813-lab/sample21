"use client";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; suffix?: string }>(function Input({ label, hint, suffix, className, id, ...rest }, ref) {
  const inputId = id ?? rest.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && <span className="block mb-1.5 text-[0.9rem] font-semibold text-neutral-text">{label}</span>}
      <span className="relative block">
        <input ref={ref} id={inputId} className={cn("h-12 w-full rounded-xl border border-neutral-border bg-white px-4 text-[1rem] text-neutral-text placeholder:text-neutral-text2/70 focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20", suffix && "pr-12", className)} {...rest} />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-text2 text-[0.9rem]">{suffix}</span>}
      </span>
      {hint && <span className="block mt-1 text-[0.82rem] text-neutral-text2">{hint}</span>}
    </label>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(function Textarea({ label, className, id, ...rest }, ref) {
  const tid = id ?? rest.name;
  return (
    <label className="block" htmlFor={tid}>
      {label && <span className="block mb-1.5 text-[0.9rem] font-semibold">{label}</span>}
      <textarea ref={ref} id={tid} className={cn("min-h-[96px] w-full rounded-xl border border-neutral-border bg-white px-4 py-3 text-[1rem] focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20", className)} {...rest} />
    </label>
  );
});

export function Select({ label, className, children, id, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const sid = id ?? rest.name;
  return (
    <label className="block" htmlFor={sid}>
      {label && <span className="block mb-1.5 text-[0.9rem] font-semibold">{label}</span>}
      <select id={sid} className={cn("h-12 w-full rounded-xl border border-neutral-border bg-white px-3 text-[1rem] focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20", className)} {...rest}>{children}</select>
    </label>
  );
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl px-1 py-2 text-left hover:bg-neutral-canvas">
      <span><span className="block font-semibold text-[0.95rem]">{label}</span>{desc && <span className="block text-[0.82rem] text-neutral-text2">{desc}</span>}</span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-fast", checked ? "bg-theme-primary" : "bg-neutral-border")}>
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-fast", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("inline-flex rounded-xl bg-neutral-canvas p-1 border border-neutral-border max-w-full overflow-x-auto hide-scrollbar", className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)} className={cn("rounded-lg font-semibold whitespace-nowrap transition-all duration-fast", size === "sm" ? "px-3 h-8 text-[0.82rem]" : "px-4 h-10 text-[0.9rem]", value === o.value ? "bg-white text-neutral-text shadow-card" : "text-neutral-text2 hover:text-neutral-text")}>{o.label}</button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("inline-flex items-center gap-1 h-10 px-4 rounded-full border text-[0.9rem] font-semibold whitespace-nowrap transition-all duration-fast", active ? "bg-brand-black text-white border-brand-black" : "bg-white border-neutral-border text-neutral-text hover:border-neutral-text2", className)}>{children}</button>
  );
}
