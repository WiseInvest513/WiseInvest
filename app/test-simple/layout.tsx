import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Simple",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestSimpleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
