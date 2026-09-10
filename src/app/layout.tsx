import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalClickSound } from "../components/GlobalClickSound";
import { BottomNav } from "../components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helmet Portfolio Experience",
  description:
    "Interactive 3D WebGL showcase with React Three Fiber, featuring dynamic tubes, spheres, and Rubens experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <GlobalClickSound />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
