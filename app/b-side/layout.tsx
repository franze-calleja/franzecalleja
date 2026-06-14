import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";

import "./b-side.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "The B-Side",
  robots: { index: false, follow: false },
};

export default function BSideLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`bside ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
