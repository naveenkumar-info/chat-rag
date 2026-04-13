'use client';

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 md:px-10 h-16 bg-[#060d1a] border-b border-[#1a2d4a]">

      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-semibold font-mono">A</span>
        </div>
        <span className="text-slate-200 text-sm font-medium tracking-wide">AI Insights</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {!isLoaded ? (
          <div className="w-8 h-8 rounded-full bg-blue-500/10 animate-pulse" />
        ) : !isSignedIn ? (
          <>
            {/* Log In — custom /log-in page */}
            <Link
              href="/log-in"
              className="px-4 py-2 text-sm font-medium text-blue-300 border border-blue-500/30 rounded-lg bg-transparent hover:bg-blue-500/10 transition-colors no-underline"
            >
              Log in
            </Link>

            {/* Get Started — custom /sign-up page */}
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg transition-colors no-underline"
            >
              Get Started
            </Link>
          </>
        ) : (
          <UserButton
            afterSwitchSessionUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 ring-2 ring-blue-500 ring-offset-2 ring-offset-[#060d1a] rounded-full",
              },
            }}
          />
        )}
      </div>
    </nav>
  );
}