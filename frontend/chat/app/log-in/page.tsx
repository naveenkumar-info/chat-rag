'use client';

import { useSignIn } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, LogIn, KeyRound, Mail, CheckCircle2 } from "lucide-react";
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
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier: emailAddress, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
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
      await signIn.create({ strategy: "reset_password_email_code", identifier: forgotEmail });
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

  // ── Shared styles ──
  const inputCls = [
    "w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-all duration-200",
  ].join(" ");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 relative overflow-hidden animate-scale-in"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 0 60px rgba(99,102,241,0.05), 0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Glow accent */}
        <div
          className="absolute -top-24 -right-24 w-56 h-56 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-muted)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <span className="text-xs font-bold font-mono tracking-wider" style={{ color: "var(--accent-hover)" }}>
              FI
            </span>
          </div>
          <div>
            <p className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Files Insight
            </p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              AI Platform
            </p>
          </div>
        </div>

        {/* ── View: Normal sign-in ── */}
        {!forgotPassword && (
          <form onSubmit={handleSignIn}>
            <h1 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Welcome back
            </h1>
            <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Sign in to your account to continue.
            </p>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
                className={inputCls}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              />
            </div>

            {/* Password */}
            <div className="mb-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
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
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end mt-2 mb-1">
              <button
                type="button"
                onClick={() => { setForgotPassword(true); setError(""); }}
                className="text-[12px] font-medium transition-colors cursor-pointer"
                style={{ color: "var(--accent-hover)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-hover)")}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-[12px] animate-slide-down"
                style={{ background: "var(--danger-muted)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-lg text-white text-[13px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)", boxShadow: "0 2px 12px var(--accent-muted)" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
            >
              <LogIn size={15} />
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <span className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>or</span>
              <span className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full h-10 rounded-lg text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-3)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-center mt-5 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              Don't have an account?{" "}
              <Link href="/sign-up" className="font-medium transition-colors no-underline" style={{ color: "var(--accent-hover)" }}>
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
              className="flex items-center gap-1.5 text-[12px] mb-5 transition-colors cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              <ArrowLeft size={13} /> Back
            </button>

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "var(--accent-muted)" }}
            >
              <Mail size={18} style={{ color: "var(--accent)" }} />
            </div>

            <h1 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Reset your password
            </h1>
            <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Enter your email and we'll send you a reset code.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className={inputCls}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              />
            </div>

            {error && (
              <div
                className="px-3 py-2 rounded-lg mb-3 text-[12px]"
                style={{ background: "var(--danger-muted)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-10 rounded-lg text-white text-[13px] font-medium transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 2px 12px var(--accent-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              Send reset code
            </button>
          </form>
        )}

        {/* ── View: Enter code + new password ── */}
        {forgotPassword && pendingReset && !resetSuccess && (
          <form onSubmit={handleResetPassword}>
            <button
              type="button"
              onClick={() => { setPendingReset(false); setError(""); }}
              className="flex items-center gap-1.5 text-[12px] mb-5 transition-colors cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              <ArrowLeft size={13} /> Back
            </button>

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "var(--accent-muted)" }}
            >
              <KeyRound size={18} style={{ color: "var(--accent)" }} />
            </div>

            <h1 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Check your email
            </h1>
            <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Enter the code sent to{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{forgotEmail}</span>{" "}
              and choose a new password.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Reset code
              </label>
              <input
                type="text"
                placeholder="······"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                className={`${inputCls} text-center font-mono text-lg tracking-[0.4em]`}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              />
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
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
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="px-3 py-2 rounded-lg mb-3 text-[12px]"
                style={{ background: "var(--danger-muted)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-10 rounded-lg text-white text-[13px] font-medium transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 2px 12px var(--accent-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              Reset password
            </button>
          </form>
        )}

        {/* ── View: Reset success ── */}
        {resetSuccess && (
          <div className="text-center py-6 animate-fade-in">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "var(--success-muted)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <CheckCircle2 size={28} style={{ color: "var(--success)" }} />
            </div>
            <h1 className="text-[20px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Password reset!
            </h1>
            <p className="text-[13px] mb-6" style={{ color: "var(--text-tertiary)" }}>
              You're now signed in with your new password.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-white text-[13px] font-medium transition-all no-underline"
              style={{ background: "var(--accent)", boxShadow: "0 2px 12px var(--accent-muted)" }}
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