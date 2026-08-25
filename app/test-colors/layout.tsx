import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Colors",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestColorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
