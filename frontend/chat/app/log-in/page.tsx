'use client';

import { useSignIn } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Forgot password states ──
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pendingReset, setPendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);



  const handleSignIn = async (e: React.FormEvent) => {
    console.log("Attempting sign-in with:", { emailAddress, password });
    e.preventDefault();
    console.log("isLoaded",isLoaded)
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
        console.log("hi")
      const result = await signIn.create({
        identifier: emailAddress,
        password,
   
      });
      console.log("Sign-in result:", result.status);
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
      }
    } catch (err: any) {
  console.error("Full Clerk Error:", err); // ADD THIS
  setError(err.errors?.[0]?.message || "Invalid email or password.");
} finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: forgotEmail,
      });
      setPendingReset(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Could not send reset email.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setResetSuccess(true);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code or password.");
    }
  };

const handleGoogleSignIn = async () => {
  if (!isLoaded || !signIn) return;
  try {
    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: "/",
    });
  } catch (err: any) {
    console.error("Google sign-in error:", err);
  }
};

  // ── Shared input className ──
  const inputCls =
    "w-full bg-[#0f1f38] border border-[#1e3a5f] rounded-lg px-3.5 py-2.5 text-slate-200 text-sm placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

  const btnPrimaryCls =
    "w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition-all active:scale-[0.99] cursor-pointer";

  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0a1628] border border-[#1a2d4a] rounded-2xl p-8 relative overflow-hidden">

        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-blue-900/20 pointer-events-none blur-2xl" />

        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-7 h-7 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-semibold font-mono">A</span>
          </div>
          <span className="text-slate-200 text-sm font-medium tracking-wide">Acme</span>
        </div>

        {/* ── View: Normal sign-in ── */}
        {!forgotPassword && (
          <form onSubmit={handleSignIn}>
            <h1 className="text-slate-100 text-xl font-semibold tracking-tight mb-1">
              Welcome back
            </h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Sign in to your account to continue.
            </p>

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
                className={inputCls}
              />
            </div>

            <div className="mb-1">
              <label className="block text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputCls} pr-10`}
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

            {/* Forgot password link */}
            <div className="flex justify-end mt-2 mb-1">
              <button
                type="button"
                onClick={() => { setForgotPassword(true); setError(""); }}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {error && <p className="text-red-400 text-xs mt-1 mb-1">{error}</p>}

            <button type="submit" disabled={loading} className={btnPrimaryCls}>
              {loading ? "Signing in…" : "Sign in"}
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
              onClick={handleGoogleSignIn}
              className="w-full bg-[#0f1f38] border border-[#1e3a5f] hover:border-blue-500/40 hover:bg-[#162844] rounded-lg py-2.5 text-slate-400 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-center mt-5 text-slate-500 text-xs">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </form>
        )}

        {/* ── View: Forgot password — enter email ── */}
        {forgotPassword && !pendingReset && (
          <form onSubmit={handleForgotRequest}>
            <button
              type="button"
              onClick={() => { setForgotPassword(false); setError(""); }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs mb-5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <h1 className="text-slate-100 text-xl font-semibold tracking-tight mb-1">
              Reset your password
            </h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Enter your email and we'll send you a reset code.
            </p>

            <div className="mb-4">
              <label className="block text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

            <button type="submit" className={btnPrimaryCls}>
              Send reset code
            </button>
          </form>
        )}

        {/* ── View: Forgot password — enter code + new password ── */}
        {forgotPassword && pendingReset && !resetSuccess && (
          <form onSubmit={handleResetPassword}>
            <button
              type="button"
              onClick={() => { setPendingReset(false); setError(""); }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs mb-5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <h1 className="text-slate-100 text-xl font-semibold tracking-tight mb-1">
              Check your email
            </h1>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Enter the code sent to{" "}
              <span className="text-slate-300 font-medium">{forgotEmail}</span>{" "}
              and choose a new password.
            </p>

            <div className="mb-4">
              <label className="block text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-1.5">
                Reset code
              </label>
              <input
                type="text"
                placeholder="······"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                className={`${inputCls} text-center font-mono text-lg tracking-[0.4em] placeholder:tracking-normal`}
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-400 text-[11px] font-medium uppercase tracking-widest mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={`${inputCls} pr-10`}
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

            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

            <button type="submit" className={btnPrimaryCls}>
              Reset password
            </button>
          </form>
        )}

        {/* ── View: Reset success ── */}
        {resetSuccess && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-slate-100 text-xl font-semibold mb-2">Password reset!</h1>
            <p className="text-slate-500 text-sm mb-6">You're now signed in with your new password.</p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all no-underline"
            >
              Go to dashboard
            </Link>
          </div>
        )}

      </div>
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