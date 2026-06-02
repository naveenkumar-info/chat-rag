'use client';

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 bg-[var(--surface-0)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] animate-slide-down">

      {/* Brand Logo & Name */}
      <Link href="/" className="flex items-center gap-2.5 no-underline group">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/25 flex items-center justify-center transition-all duration-300 group-hover:border-[var(--accent)]/50 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.2)]">
          <span className="text-[var(--accent-hover)] text-xs font-bold font-mono tracking-wider">FI</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--text-primary)] text-sm font-semibold tracking-tight leading-none transition-colors duration-200 group-hover:text-white">
            Files Insight
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase mt-0.5 font-medium">
            AI Platform
          </span>
        </div>
      </Link>

      {/* Action Area */}
      <div className="flex items-center gap-4">
        {!isLoaded ? (
          <div className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] animate-pulse" />
        ) : !isSignedIn ? (
          <div className="flex items-center gap-3">
            {/* Custom /log-in link */}
            <Link
              href="/log-in"
              className="px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors no-underline"
            >
              Log in
            </Link>

            {/* Custom /sign-up button */}
            <Link
              href="/sign-up"
              className="px-4 py-2 text-[13px] font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] border border-[var(--accent)]/10 rounded-lg shadow-sm shadow-[var(--accent-muted)] transition-all duration-200 no-underline hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3.5">
            {/* Link to dashboard files if logged in */}
            <Link
              href="/dashboard/files"
              className="px-3.5 py-1.5 text-[13px] font-medium rounded-lg text-[var(--text-secondary)] border border-[var(--border-subtle)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-all no-underline"
            >
              Dashboard
            </Link>

            <UserButton
              afterSwitchSessionUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 ring-2 ring-[var(--accent)]/30 ring-offset-2 ring-offset-[var(--surface-0)] rounded-full hover:ring-[var(--accent)]/60 transition-all",
                },
              }}
            />
          </div>
        )}
      </div>
    </nav>
  );
}