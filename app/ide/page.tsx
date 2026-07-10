import { redirect } from "next/navigation";

/** Legacy /ide route — IDE now lives at `/`. */
export default function IdeRedirectPage() {
  redirect("/");
}
