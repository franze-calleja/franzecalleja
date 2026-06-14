import type { CSSProperties, ReactNode } from "react";

type BrutalBlockProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

// Brutalist container: thick border + hard offset shadow, no radius.
// Marked as a reveal target so the parent's useGsapReveal animates it in.
export default function BrutalBlock({
  children,
  className,
  style,
}: BrutalBlockProps) {
  return (
    <div data-reveal="true" className={`bs-block ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
