import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RealtimeProvider from "@/components/RealtimeProvider";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
title: "budol₱ay Admin",
  description: "Administrative control panel for budol₱ay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50`}>
        <div className="flex min-h-screen">
          <RealtimeProvider />
          <Sidebar />
          <SessionProvider>
            <MainContent>
              {children}
            </MainContent>
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
