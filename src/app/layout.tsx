import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "NYTO Venue",
  description: "Partner floor — nights, door check-in, and NYTO support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased text-text">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
