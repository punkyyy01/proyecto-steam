"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [steamId, setSteamId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("steam_id")
        .eq("id", user.id)
        .single();

      if (profile?.steam_id) {
        setSteamId(profile.steam_id);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, steam_id: steamId }, { onConflict: "id" });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Steam ID guardado correctamente." });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted text-sm mt-1">
          Configura tu cuenta y vincula tu Steam ID.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-muted text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="steamId"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Steam ID
            </label>
            <input
              id="steamId"
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="76561198000000000"
            />
            <p className="text-xs text-muted mt-2">
              Tu Steam ID de 64 bits. Encuéntralo en{" "}
              <a
                href="https://steamid.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-hover transition-colors"
              >
                steamid.io
              </a>
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-success/10 border border-success/30 text-success"
                : "bg-danger/10 border border-danger/30 text-danger"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white
            font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
