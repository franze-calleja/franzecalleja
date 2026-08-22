import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CursorFollower from "@/components/cursor-follower";
import MainBottomNav from "@/components/main-bottom-nav";
import { SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Franze William Calleja — Full-Stack Software Engineer",
    template: "%s | Franze William Calleja",
  },
  description:
    "Full-stack software engineer specializing in scalable enterprise systems, robust cloud infrastructure, and end-to-end product architecture.",
  applicationName: "Franze William Calleja Portfolio",
  authors: [{ name: "Franze William Calleja", url: SITE_URL }],
  creator: "Franze William Calleja",
  publisher: "Franze William Calleja",
  keywords: [
    "Franze William Calleja",
    "Franze Calleja",
    "Software Engineer",
    "Full-Stack Software Engineer",
    "Enterprise Systems Architecture",
    "Next.js Developer",
    "React Engineer",
    "TypeScript",
    "shadcn/ui",
    "Vitest",
    "Hermes",
    "Python",
    "Flask",
    "Ollama",
    "n8n",
    "TanStack",
    "Node.js",
    "Express.js",
    "Prisma ORM",
    "Docker Containers",
    "Grafana Prometheus Observability",
    "Agentic AI Developer",
    "MSEUF-CI",
    "Portfolio",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Franze William Calleja — Full-Stack Software Engineer",
    description:
      "Full-stack software engineer specializing in scalable enterprise systems, robust cloud infrastructure, and end-to-end product architecture.",
    siteName: "Franze William Calleja",
    url: SITE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 1200,
        alt: "Franze William Calleja — </Franze>",
        type: "image/png",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Franze William Calleja — Full-Stack Software Engineer",
    description:
      "Full-stack software engineer specializing in scalable enterprise systems, robust cloud infrastructure, and end-to-end product architecture.",
    images: ["/og-image.png"],
    creator: "@franze_calleja",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Franze William Calleja",
      url: SITE_URL,
      image: `${SITE_URL}/profile.png`,
      jobTitle: "Full-Stack Software Engineer",
      description:
        "Full-stack software engineer specializing in scalable enterprise systems, robust cloud infrastructure, and end-to-end product architecture.",
      alumniOf: {
        "@type": "EducationalOrganization",
        name: "Manuel S. Enverga University Foundation - Candelaria Inc.",
      },
      sameAs: [
        "https://github.com/franze-calleja",
        "https://linkedin.com/in/franzecalleja",
      ],
      knowsAbout: [
        "TypeScript",
        "JavaScript",
        "shadcn/ui",
        "Vitest",
        "Hermes",
        "Python",
        "Flask",
        "Next.js",
        "React",
        "TanStack",
        "Ollama",
        "n8n",
        "Node.js",
        "Express.js",
        "Prisma ORM",
        "MySQL",
        "PostgreSQL",
        "Docker",
        "Grafana",
        "Prometheus",
        "Telemetry Observability",
        "Agentic AI",
        "Cloud Infrastructure",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Franze William Calleja — Portfolio",
      description:
        "Personal portfolio and technical engineering archive of Franze William Calleja.",
      publisher: {
        "@id": `${SITE_URL}/#person`,
      },
      inLanguage: "en-US",
    },
  ],
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CursorFollower />
        {children}
        <MainBottomNav />
      </body>
    </html>
  );
}
