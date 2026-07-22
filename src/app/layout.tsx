import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpsBrain — Industrial Knowledge Intelligence",
  description:
    "AI-powered knowledge intelligence platform for asset-intensive industrial operations. Cross-document reasoning via knowledge graph + RAG copilot, lessons-learned agent, and compliance gap detector.",
  keywords: [
    "OpsBrain",
    "Industrial AI",
    "Knowledge Graph",
    "RAG",
    "Compliance",
    "OISD-118",
    "Plant Operations",
  ],
  authors: [{ name: "OpsBrain Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Sonner richColors position="top-right" />
      </body>
    </html>
  );
}
