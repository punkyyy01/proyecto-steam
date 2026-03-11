"use client";

import { useState } from "react";

interface SyncResult {
  success: boolean;
  games_found: number;
  snapshots_inserted: number;
  warnings?: string[];
  error?: string;
}

export default function Dashboard() {
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
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-8">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-center">Steam Tracker</h1>
        <p className="text-gray-400 text-center text-sm">
          Sincroniza tus horas de juego de Steam para empezar a rastrear tu historial.
        </p>

        <button
          onClick={handleSync}
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer
            bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {loading ? "Sincronizando..." : "Sincronizar mis horas de Steam"}
        </button>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-sm">
            <p className="font-semibold text-red-300">Error</p>
            <p className="text-red-200 mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 text-sm space-y-2">
            <p className="font-semibold text-green-300">Sincronización completada</p>
            <ul className="text-green-200 space-y-1">
              <li>Juegos encontrados: <span className="font-mono">{result.games_found}</span></li>
              <li>Snapshots guardados: <span className="font-mono">{result.snapshots_inserted}</span></li>
            </ul>
            {result.warnings && result.warnings.length > 0 && (
              <div className="mt-2 text-yellow-300 text-xs">
                <p className="font-semibold">Advertencias:</p>
                <ul className="list-disc list-inside">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
