import { redirect } from "next/navigation";

type IdeRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy `/ide` route — IDE lives at `/`. Preserve share query params. */
export default async function IdeRedirectPage({ searchParams }: IdeRedirectProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) qs.append(key, item);
    }
  }
  const query = qs.toString();
  redirect(query ? `/?${query}` : "/");
}
