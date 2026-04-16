// app/sso-callback/page.tsx
'use client';

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-7 h-7 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-semibold font-mono">A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
        </div>
        <p className="text-slate-500 text-sm">Completing sign in…</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}