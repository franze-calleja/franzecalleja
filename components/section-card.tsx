import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ children, className }: SectionCardProps) {
  return (
    <article
      className={`rounded-md border border-(--border) bg-(--surface) p-4 shadow-sm shadow-black/5 transition-colors sm:p-5 ${className ?? ""}`}
    >
      {children}
    </article>
  );
}