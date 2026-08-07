import { Github, Users, BookMarked, Calendar } from "lucide-react";
import SectionCard from "./section-card";

type GitHubUser = {
  public_repos: number;
  followers: number;
  created_at: string;
};

async function fetchGitHubUser(): Promise<GitHubUser | null> {
  try {
    const res = await fetch("https://api.github.com/users/franze-calleja", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const STATS = [
  { icon: BookMarked, label: "Public repos" },
  { icon: Users, label: "Followers" },
  { icon: Calendar, label: "Member since" },
] as const;

export default async function GithubStatsCard() {
  const user = await fetchGitHubUser();

  const memberYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : null;

  const values = [
    user?.public_repos ?? "—",
    user?.followers ?? "—",
    memberYear ?? "—",
  ];

  return (
    <SectionCard style={{ animationDelay: "910ms" }}>
      <div className="flex h-full flex-col gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
            GitHub
          </p>
          <a
            href="https://github.com/franze-calleja"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-(--muted) transition-colors hover:text-foreground sm:text-sm"
          >
            <Github className="h-3.5 w-3.5" />
            franze-calleja
          </a>
        </div>

        <div className="flex flex-col gap-3">
          {STATS.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-(--muted)">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {values[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
