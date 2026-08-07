import { Github, Users, BookMarked, Calendar } from "lucide-react";
import BrutalBlock from "./brutal-block";

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

export default async function BSideGithubStats() {
  const user = await fetchGitHubUser();

  const memberYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : "—";

  const stats = [
    { icon: BookMarked, label: "Public repos", value: user?.public_repos ?? "—" },
    { icon: Users, label: "Followers", value: user?.followers ?? "—" },
    { icon: Calendar, label: "Member since", value: memberYear },
  ];

  return (
    <BrutalBlock>
      <span className="bs-idx">11 / GITHUB STATS</span>
      <a
        href="https://github.com/franze-calleja"
        target="_blank"
        rel="noopener noreferrer"
        className="bs-mono"
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.6rem", fontSize: "0.78rem", opacity: 0.7 }}
      >
        <Github style={{ width: "0.9rem", height: "0.9rem" }} />
        franze-calleja
      </a>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="bs-mono" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", opacity: 0.65 }}>
              <Icon style={{ width: "0.8rem", height: "0.8rem" }} />
              {label}
            </span>
            <span className="bs-mono" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </BrutalBlock>
  );
}
