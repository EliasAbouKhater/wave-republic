import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { requireManager } from "@/lib/auth";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireManager();

  return (
    <div className="min-h-screen w-full" style={{ background: "#F4FBF9" }}>
      <BackofficeShell staff={staff}>{children}</BackofficeShell>
    </div>
  );
}
