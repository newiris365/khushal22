import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { Inter, Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";

// Self-hosted Google Fonts via next/font — zero render-blocking requests
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Lazy-load AIChatWidget — 523-line component with API calls shouldn't block initial render
const AIChatWidget = dynamic(() => import("../components/AIChatWidget"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "IRIS 365 | Next-Gen Campus Operating System",
  description: "AI-powered automation platform for modern educational institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0D0A1A] text-white antialiased font-sans selection:bg-[#6C2BD9]">
        {children}
        <AIChatWidget />
      </body>
    </html>
  );
}
