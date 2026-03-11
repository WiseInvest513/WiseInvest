import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "飞书文章注册",
  robots: "noindex, nofollow",
};

export default function Article513Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
