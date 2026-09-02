import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ConsentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value) query.append(key, value);
  });

  redirect(`/oauth/authorize${query.size ? `?${query.toString()}` : ""}`);
}
