'use client';

import Link from "next/link";
import { useAuth, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <nav
        className="flex items-center justify-between px-8 h-16"
        style={{
          background: "linear-gradient(90deg, #0a0f1e 0%, #0d1b3e 50%, #102a5c 100%)",
          borderBottom: "1px solid rgba(59,130,246,0.18)",
        }}
      >
        <div className="w-24 h-6 rounded animate-pulse" style={{ background: "rgba(96,165,250,0.15)" }} />
        <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: "rgba(96,165,250,0.15)" }} />
      </nav>
    );
  }

  return (
    <nav
      className="flex items-center justify-between px-8 h-16"
      style={{
        background: "linear-gradient(90deg, #0a0f1e 0%, #0d1b3e 50%, #102a5c 100%)",
        borderBottom: "1px solid rgba(59,130,246,0.18)",
      }}
    >
      {/* Brand Logo */}
      <div style={{ fontSize: "1.25rem", fontWeight: 500, color: "#60a5fa", letterSpacing: "-0.02em" }}>
        <Link href="/">AI Insights</Link>
      </div>

      <div className="flex items-center gap-3">
        {!isSignedIn ? (
          <>
            {/* Sign In — opens Clerk modal */}
            <SignInButton mode="modal">
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: "#93c5fd",
                  background: "transparent",
                  border: "1px solid rgba(96,165,250,0.3)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(96,165,250,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                Log In
              </button>
            </SignInButton>

            {/* Sign Up — opens Clerk modal */}
            <SignUpButton mode="modal">
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
                style={{ background: "#1d4ed8", border: "1px solid #2563eb" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1e40af")}
                onMouseLeave={e => (e.currentTarget.style.background = "#1d4ed8")}
              >
                Get Started
              </button>
            </SignUpButton>
          </>
        ) : (
          <div className="flex items-center gap-5">
            
            {/* 
              UserButton handles:
              - View profile
              - Switch accounts
              - Sign out  ← built-in, no extra code needed
              
              appearance prop styles the avatar button to match the navy theme.
            */}
            <UserButton
            afterSwitchSessionUrl='/'
              appearance={{
                elements: {
                  avatarBox: {
                    width: 34,
                    height: 34,
                    border: "2px solid #3b82f6",
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </nav>
  );
}