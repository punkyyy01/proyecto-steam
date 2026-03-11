"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes("rate limit")) {
        setError("Has alcanzado el límite de intentos. Por favor, espera 1 minuto antes de volver a intentarlo.");
        setTimeout(() => setError(null), 60000); // Clear error after 1 minute
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // If session exists, email confirmation is disabled → go straight to dashboard
    if (data.session) {
      router.push("/dashboard");
      return;
    }

    // Otherwise, email confirmation is required
    setConfirmationSent(true);
    setLoading(false);
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
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white
              font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
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
