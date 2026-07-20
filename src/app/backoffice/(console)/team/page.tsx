import { db } from "@/lib/db";
import { TeamSection } from "@/components/backoffice/TeamSection";

export default async function TeamPage() {
  const [staff, restaurants] = await Promise.all([
    db.staff.findMany({ where: { active: true }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
    db.restaurant.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  return (
    <TeamSection
      canReassign={true}
      staff={staff.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        kioskId: s.kioskId,
        removable: s.removable,
      }))}
      restaurants={restaurants}
    />
  );
}
