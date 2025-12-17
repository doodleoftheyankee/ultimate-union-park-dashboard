import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Union Park Dashboard | Professional Grade",
  description: "Sales performance dashboard for Union Park Buick GMC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
