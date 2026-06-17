import type { Metadata } from "next";
import { Literata, Nunito_Sans } from "next/font/google";
import { BlogProvider } from "@/context/BlogContext";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  weight: ["200", "300", "400", "600", "700", "800", "900", "1000"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Kemitbelajar — Rooted Warmth Solo Blog",
  description: "A minimalist solo blog built for slow reading, deep insights, and mindful writing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${literata.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface transition-colors duration-200">
        <AuthProvider>
          <BlogProvider>
            {children}
          </BlogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
