import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ChatAssistant from "@/components/chat-assistant";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://franzecalleja.dev"),
  title: {
    default: "Franze William Calleja",
    template: "%s | Franze William Calleja",
  },
  description:
    "Franze William Calleja's personal portfolio featuring full-stack software engineering work, projects, experience, and tech stack.",
  applicationName: "Franze William Calleja",
  authors: [{ name: "Franze William Calleja" }],
  creator: "Franze William Calleja",
  publisher: "Franze William Calleja",
  keywords: [
    "Franze William Calleja",
    "Software Engineer",
    "Full-Stack Developer",
    "Next.js",
    "React",
    "TypeScript",
    "Portfolio",
  ],
  openGraph: {
    type: "website",
    title: "Franze William Calleja",
    description:
      "Full-stack software engineer focused on production-ready systems.",
    siteName: "Franze William Calleja",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Franze William Calleja" }],
  },
  twitter: {
    card: "summary",
    title: "Franze William Calleja",
    description:
      "Full-stack software engineer focused on production-ready systems.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.dataset.theme = savedTheme || preferredTheme;
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ChatAssistant />
      </body>
    </html>
  );
}
