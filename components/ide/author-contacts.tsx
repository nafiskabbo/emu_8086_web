"use client";

import { IconGitHub } from "@/components/ide/editor-icons";
import { APP_AUTHOR, APP_REPO_URL } from "@/lib/version";

const LINKS = [
  {
    label: "Source",
    href: APP_REPO_URL,
    icon: "github" as const,
    title: "Open-source repository — contribute on GitHub",
  },
  { label: "Portfolio", href: APP_AUTHOR.site },
  {
    label: "GitHub",
    href: APP_AUTHOR.github,
    icon: "github" as const,
    title: "Nafis Islam Kabbo on GitHub",
  },
  { label: "LinkedIn", href: APP_AUTHOR.linkedin },
  { label: "WhatsApp", href: APP_AUTHOR.whatsapp },
  { label: "Email", href: `mailto:${APP_AUTHOR.email}` },
] as const;

export function AuthorContacts({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-3 gap-y-1.5 text-xs ${className}`}>
      {LINKS.map((l) => {
        const hasIcon = "icon" in l && l.icon === "github";
        return (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              title={"title" in l ? l.title : undefined}
              className="inline-flex items-center gap-1 text-amber hover:underline"
            >
              {hasIcon ? <IconGitHub className="h-3.5 w-3.5 shrink-0" /> : null}
              {l.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
