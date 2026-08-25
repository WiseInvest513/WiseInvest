import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Data",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
