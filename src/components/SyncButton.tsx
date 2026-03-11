"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SyncResult {
  success: boolean;
  games_found: number;
  snapshots_inserted: number;
  warnings?: string[];
  error?: string;
}

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/steam/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error desconocido al sincronizar.");
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50
          text-white text-sm font-medium rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" />
          </svg>
        )}
        {loading ? "Sincronizando..." : "Sincronizar Steam"}
      </button>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-sm text-success">
          {result.games_found} juegos encontrados &middot; {result.snapshots_inserted} snapshots guardados
          {result.warnings?.map((w, i) => (
            <p key={i} className="text-warning text-xs mt-1">{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
