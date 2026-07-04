import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Task & Annotate App",
  description: "A premium 2-in-1 web app for task management and image annotation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500/30`}>
        {children}
      </body>
    </html>
  );
}
