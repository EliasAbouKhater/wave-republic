import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const staff = await getCurrentStaff();
  if (staff) redirect("/backoffice");

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg,#0EA5A4,#0BA5E9 65%,#0A7FC0)" }}
    >
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <div className="font-display font-extrabold text-white text-[30px]">Wave Republic</div>
          <div className="text-white/80 text-[12px] font-extrabold uppercase tracking-[0.6px] mt-1">
            Manager console
          </div>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
