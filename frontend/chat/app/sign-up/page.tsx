"use client";

import { useSignUp } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;

const handleGoogleSignUp = async () => {
  if (!isLoaded || !signUp) return;
  try {
    await signUp.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: "/",
    });

   // await axios.post(`${NEXT_API_URL}/create-user/`, formData);
  } catch (err: any) {
    setError(err.errors?.[0]?.longMessage ?? err.errors?.[0]?.message ?? "Google sign-up failed.");
  }
};

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    try {
      const result = await signUp.create({ 
        emailAddress, 
        password,
      });
      
      
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Something went wrong.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        // Add small delay to ensure session is established before redirect
        setTimeout(() => {
          const redirectUrl = "/";
          window.location.href = redirectUrl;
        }, 500);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md bg-[#0a1628] border border-[#1a2d4a] rounded-2xl p-8 relative overflow-hidden">

        {/* Subtle glow accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-blue-900/20 pointer-events-none blur-2xl" />

        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-7 h-7 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-semibold font-mono">A</span>
          </div>
          <span className="text-slate-200 text-sm font-medium tracking-wide">Acme</span>
        </div>

        {!pendingVerification ? (
          /* ── Sign-up form ── */
          <form onSubmit={handleSignUp}>
            <h1 className="text-slate-100 text-xl font-semibold tracking-tight mb-1">
              Create your account
            </h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Welcome! Please fill in your details to get started.
            </p>


            {/* Email */}
            <div className="mb-4">
              <label className="block text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
                className="w-full bg-[#0f1f38] border border-[#1e3a5f] rounded-lg px-3.5 py-2.5 text-slate-200 text-sm placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0f1f38] border border-[#1e3a5f] rounded-lg px-3.5 py-2.5 pr-10 text-slate-200 text-sm placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-1 mb-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg py-2.5 transition-all active:scale-[0.99] cursor-pointer"
            >
              Continue
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <span className="flex-1 h-px bg-[#1a2d4a]" />
              <span className="text-slate-600 text-xs">or</span>
              <span className="flex-1 h-px bg-[#1a2d4a]" />
            </div>

            {/* Google */}
            <button
  type="button"
  onClick={handleGoogleSignUp}
  className="w-full bg-[#0f1f38] border border-[#1e3a5f] hover:border-blue-500/40 hover:bg-[#162844] rounded-lg py-2.5 text-slate-400 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
>
  <GoogleIcon />
  Continue with Google
</button>

            <p className="text-center mt-5 text-slate-500 text-xs">
              Already have an account?{" "}
              <a href="/log-in" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in
              </a>
            </p>
          </form>
        ) : (
          /* ── Verification form ── */
          <form onSubmit={handleVerify}>
            <button
              type="button"
              onClick={() => setPendingVerification(false)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs mb-5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              Back
            </button>

            <h1 className="text-slate-100 text-xl font-semibold tracking-tight mb-1">
              Check your email
            </h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              We sent a 6-digit code to{" "}
              <span className="text-slate-300 font-medium">{emailAddress}</span>
            </p>

            <div className="mb-4">
              <label className="block text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-1.5">
                Verification code
              </label>
              <input
                type="text"
                placeholder="······"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-[#0f1f38] border border-[#1e3a5f] rounded-lg px-3.5 py-2.5 text-slate-200 text-lg font-mono text-center tracking-[0.4em] placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-1 mb-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg py-2.5 transition-all active:scale-[0.99] cursor-pointer"
            >
              Verify email
            </button>

            <p className="text-center mt-4 text-slate-500 text-xs">
              Didn't receive it?{" "}
              <button
                type="button"
                onClick={() =>
                  signUp.prepareEmailAddressVerification({ strategy: "email_code" })
                }
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
              >
                Resend code
              </button>
            </p>
          </form>
        )}
      </div>
      <div id="clerk-captcha" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}