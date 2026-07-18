import { redirect } from "next/navigation";

export default async function OldPerks2SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  redirect(`/perk/${section}`);
}
