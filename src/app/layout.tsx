import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Task Assign Dashboard",
  description: "Clean Next.js starter for the Task Assign Dashboard project.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Task Assign",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0C447C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-slate-100 text-slate-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
