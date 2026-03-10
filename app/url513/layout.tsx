import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "短链生成",
  robots: "noindex, nofollow",
};

export default function Url513Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
