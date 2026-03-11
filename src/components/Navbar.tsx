"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold text-foreground"
        >
          <svg
            width="26"
            height="26"
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

        <div className="flex items-center gap-3">
          {loggedIn === null ? null : loggedIn ? (
            <Link
              href="/dashboard"
              className="text-sm px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
            >
              Ir al panel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="text-sm px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
