"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const RATE_LIMIT_FALLBACK_SECONDS = 300;

type SupabaseAuthError = {
  message: string;
  status?: number;
  code?: string;
};

function parseRetryAfterSeconds(message: string): number | null {
  const minuteMatch = message.match(/(\d+)\s*(minute|minuto)s?/i);
  if (minuteMatch) {
    return Number(minuteMatch[1]) * 60;
  }

  const secondMatch = message.match(/(\d+)\s*(second|segundo)s?/i);
  if (secondMatch) {
    return Number(secondMatch[1]);
  }

  const plainNumberMatch = message.match(/(\d+)/);
  if (plainNumberMatch) {
    return Number(plainNumberMatch[1]);
  }

  return null;
}

function formatRemainingTime(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
  }

  return `${seconds} segundo${seconds === 1 ? "" : "s"}`;
}

function isRateLimitError(error: SupabaseAuthError): boolean {
  const message = error.message.toLowerCase();
  const code = error.code?.toLowerCase() ?? "";

  return (
    error.status === 429 ||
    code.includes("rate_limit") ||
    code.includes("too_many_requests") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("security purposes")
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownUntilRef = useRef<number | null>(null);
  const submissionLockRef = useRef(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const cooldownUntil = cooldownUntilRef.current;
      if (!cooldownUntil) {
        setCooldownSeconds(0);
        window.clearInterval(intervalId);
        return;
      }

      const remaining = Math.max(
        0,
        Math.ceil((cooldownUntil - Date.now()) / 1000)
      );

      setCooldownSeconds(remaining);

      if (remaining === 0) {
        cooldownUntilRef.current = null;
        setError((currentError) => {
          if (currentError?.startsWith("Demasiados intentos")) {
            return null;
          }
          return currentError;
        });
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submissionLockRef.current || loading) {
      return;
    }

    if (cooldownSeconds > 0) {
      setError(`Demasiados intentos. Vuelve a intentar en ${formatRemainingTime(cooldownSeconds)}.`);
      return;
    }

    submissionLockRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const authError = error as SupabaseAuthError;

        if (isRateLimitError(authError)) {
          const retryAfterSeconds =
            parseRetryAfterSeconds(authError.message) ?? RATE_LIMIT_FALLBACK_SECONDS;
          cooldownUntilRef.current = Date.now() + retryAfterSeconds * 1000;
          setCooldownSeconds(retryAfterSeconds);
          setError(
            `Demasiados intentos. Vuelve a intentar en ${formatRemainingTime(retryAfterSeconds)}.`
          );
          return;
        }

        if (authError.message.toLowerCase().includes("already registered")) {
          setError("Este email ya está registrado. Inicia sesión o restablece la contraseña.");
          return;
        }

        setError(authError.message);
        return;
      }

      // If session exists, email confirmation is disabled → go straight to dashboard
      if (data.session) {
        router.push("/dashboard");
        return;
      }

      // Otherwise, email confirmation is required
      setConfirmationSent(true);
    } finally {
      submissionLockRef.current = false;
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <path d="M22 12a10 10 0 11-20 0 10 10 0 0120 0z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Revisa tu email
          </h1>
          <p className="text-muted text-sm">
            Hemos enviado un enlace de confirmación a <strong className="text-foreground">{email}</strong>.
            Haz clic en él para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-foreground inline-flex items-center gap-2.5"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M12 12h.01M6 12h4M8 10v4" />
            </svg>
            Steam Tracker
          </Link>
          <p className="text-muted text-sm mt-3">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white
              font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading
              ? "Creando cuenta..."
              : cooldownSeconds > 0
                ? `Reintentar en ${cooldownSeconds}s`
                : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
