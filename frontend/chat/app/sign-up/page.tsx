'use client';

import { useSignUp } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, UserPlus, KeyRound, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    setError("");
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? err.errors?.[0]?.message ?? "Google sign-up failed.");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({ 
        emailAddress, 
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setVerifying(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        // Add small delay to ensure session is established before redirect
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code.");
    } finally {
      setVerifying(false);
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

        {!pendingVerification ? (
          /* ── Sign-up Form ── */
          <form onSubmit={handleSignUp}>
            <h1 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Create your account
            </h1>
            <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              Welcome! Please fill in your details to get started.
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
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
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

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-[12px] animate-slide-down"
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
              <UserPlus size={15} />
              {loading ? "Creating account…" : "Create account"}
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
              onClick={handleGoogleSignUp}
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
              Already have an account?{" "}
              <Link href="/log-in" className="font-medium transition-colors no-underline" style={{ color: "var(--accent-hover)" }}>
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          /* ── Verification Form ── */
          <form onSubmit={handleVerify}>
            <button
              type="button"
              onClick={() => { setPendingVerification(false); setError(""); }}
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
              <ShieldCheck size={18} style={{ color: "var(--accent)" }} />
            </div>

            <h1 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Check your email
            </h1>
            <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              We sent a 6-digit verification code to{" "}
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{emailAddress}</span>
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Verification code
              </label>
              <input
                type="text"
                placeholder="······"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className={`${inputCls} font-mono text-center text-lg tracking-[0.4em] placeholder:tracking-normal`}
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-[12px] animate-slide-down"
                style={{ background: "var(--danger-muted)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-lg text-white text-[13px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)", boxShadow: "0 2px 12px var(--accent-muted)" }}
              onMouseEnter={(e) => { if (!verifying) e.currentTarget.style.background = "var(--accent-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
            >
              {verifying ? "Verifying email…" : "Verify email"}
            </button>

            <p className="text-center mt-4 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              Didn't receive it?{" "}
              <button
                type="button"
                onClick={() =>
                  signUp.prepareEmailAddressVerification({ strategy: "email_code" })
                }
                className="font-medium transition-colors cursor-pointer border-none bg-transparent p-0"
                style={{ color: "var(--accent-hover)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-hover)")}
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