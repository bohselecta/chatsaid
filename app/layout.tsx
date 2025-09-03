import type { Metadata, Viewport } from "next";
import "./globals.css";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/nav/HeaderNav";

import MobileNav from "@/components/MobileNav";
import Image from "next/image";
import PuntNotificationWrapper from "@/components/PuntNotificationWrapper";
import BotProvider from "@/components/bot/BotProvider";
import { CATEGORIES } from "@/lib/nav/categories";
import WriterRoot from "@/components/assistant/WriterRoot";
import AnalyticsInit from "@/components/AnalyticsInit";
// Bot interaction scheduler will be initialized on the client side
// when users access the bot-twin page with their API key

export const metadata: Metadata = {
  title: "ChatSaid — Say it. See it. Share it.",
  description: "AI studio for ideas, images, and interactive posts.",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "ChatSaid — Say it. See it. Share it.",
    description: "AI studio for ideas, images, and interactive posts.",
    images: ["/virtual-home/bg-skyline-1600w.webp"],
    url: "https://chatsaid.com",
    siteName: "ChatSaid",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatSaid — Say it. See it. Share it.",
    description: "Create with your assistant. Curate boards. Publish beautifully.",
    images: ["/virtual-home/bg-skyline-1600w.webp"],
  },
  icons: {
    icon: [
      { url: "/assets/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/assets/app-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d11a2a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <AnalyticsInit />
        <PuntNotificationWrapper />
        <BotProvider>
          {/* Header */}
        <header className="bg-gray-800 border-b border-gray-600 sticky top-0 z-50">
          <HeaderNav />
        </header>




              

        {/* Mobile Navigation Overlay */}
        <MobileNav />

        {/* Main Content */}
        <main className="min-h-screen bg-gray-900">{children}</main>

        {/* Global Writer modal mount */}
        <WriterRoot />

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-600 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <Logo size="lg" />
                </div>
                <p className="text-gray-300 text-sm">
                  Say it. See it. ChatSaid. The platform for sharing and discovering amazing AI conversations.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-white mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/canopy" className="text-gray-300 hover:text-red-500 transition-colors">Home</a></li>
                  <li><a href="/explore" className="text-gray-300 hover:text-red-500 transition-colors">Explore</a></li>
                  <li><a href="/about" className="text-gray-300 hover:text-red-500 transition-colors">About</a></li>
                  <li><a href="/help" className="text-gray-300 hover:text-red-500 transition-colors">Help</a></li>
                </ul>
              </div>

              {/* Main Branches */}
              <div>
                <h3 className="font-semibold text-white mb-3">Main Branches</h3>
                <ul className="space-y-2 text-sm">
                  {CATEGORIES.map((cat) => (
                    <li key={cat.key}>
                      <a href={cat.href} className="text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2">
                        <Image src={cat.iconPath} alt={cat.label} width={16} height={16} />
                        {cat.label} Branch
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-600 mt-8 pt-8 text-center">
              <p className="text-gray-300 text-sm">
                © 2025 ChatSaid. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        </BotProvider>
      </body>
    </html>
  );
}

 

