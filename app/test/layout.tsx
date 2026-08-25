import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
