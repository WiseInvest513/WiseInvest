import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debug Test",
  description: "Debug test page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div style={{ padding: '2rem' }}>
          <h1>Debug Layout</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
