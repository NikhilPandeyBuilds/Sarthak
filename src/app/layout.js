import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SAKSHAT // Adaptive AI Interview Chamber",
  description: "An adaptive, immersive cybernetic technical interview simulation evaluating core competencies, communication, and resume claims.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#030712]">
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} font-sans min-h-full flex flex-col antialiased text-slate-200`}
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
