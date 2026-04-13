// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/component/Navbar";
import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic"; // ← add this

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Insights",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Add a small debug log here to see if the key is actually reaching the code
  console.log("Layout Publishable Key:", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}