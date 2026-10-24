import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Nav } from "@/components/ui";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Tavishi Careers",
  description: "Worldwide job search with explainable matching and your approval on every application.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Nav />
        <main className="tc-container tc-main">{children}</main>
        <footer className="tc-footer"><div className="tc-container">© Tavishi Careers</div></footer>
      </body>
    </html>
  );
}
