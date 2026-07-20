import { redirect } from "next/navigation";

// /backoffice → default landing is Analytics (the whole point of Phase 1).
// Auth is enforced by the (console)/layout.tsx.
export default function BackofficeIndex() {
  redirect("/backoffice/analytics");
}
