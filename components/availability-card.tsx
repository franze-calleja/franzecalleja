import content from "@/app/profile-data.json";
import { Mail } from "lucide-react";
import SectionCard from "./section-card";

export default function AvailabilityCard() {
  const { status, statusType, description, preferredRoles, contactHref } =
    content.availability;

  const isOpen = statusType === "open";

  return (
    <SectionCard>
      <div className="space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
          {content.availability.eyebrow}
        </p>

        <div className="space-y-3">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${isOpen ? "bg-green-500" : "bg-amber-400"}`}
              aria-hidden="true"
            />
            <span
              className={`text-sm font-semibold ${isOpen ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
            >
              {status}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-(--muted) sm:text-sm">
            {description}
          </p>

          {/* Preferred roles */}
          <div className="flex flex-wrap gap-1.5">
            {preferredRoles.map((role) => (
              <span
                key={role}
                className="rounded-md border border-(--border) px-2 py-0.5 text-xs text-(--muted)"
              >
                {role}
              </span>
            ))}
          </div>

          {/* CTA */}
          <a
            href={contactHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80"
          >
            <Mail size={12} aria-hidden="true" />
            Get in touch
          </a>
        </div>
      </div>
    </SectionCard>
  );
}
