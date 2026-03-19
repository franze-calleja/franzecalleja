import type { CSSProperties, ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function SectionCard({ children, className, style }: SectionCardProps) {
  return (
    <article
      className={`animate-card-enter rounded-md border border-(--border) bg-(--surface) p-4 shadow-sm shadow-black/5 transition-colors motion-reduce:animate-none sm:p-5 ${className ?? ""}`}
      style={style}
    >
      {children}
    </article>
  );
}