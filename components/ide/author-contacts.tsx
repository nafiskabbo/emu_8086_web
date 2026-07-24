"use client";

import { APP_AUTHOR } from "@/lib/version";

const LINKS = [
  { label: "Portfolio", href: APP_AUTHOR.site },
  { label: "GitHub", href: APP_AUTHOR.github },
  { label: "LinkedIn", href: APP_AUTHOR.linkedin },
  { label: "WhatsApp", href: APP_AUTHOR.whatsapp },
  { label: "Email", href: `mailto:${APP_AUTHOR.email}` },
] as const;

export function AuthorContacts({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-3 gap-y-1 text-xs ${className}`}>
      {LINKS.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target={l.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="text-amber hover:underline"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
