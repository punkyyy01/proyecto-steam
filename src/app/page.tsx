import Link from "next/link";
import Navbar from "@/components/Navbar";

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Seguimiento automático de horas
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Rastrea tu tiempo
            <br />
            <span className="text-primary">de juego en Steam</span>
          </h1>

          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Sincroniza tu biblioteca de Steam, visualiza tus estadísticas
            de juego y lleva un historial detallado de tus horas jugadas.
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/signup"
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
            >
              Comenzar gratis
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-border text-foreground hover:bg-card rounded-xl transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-center text-muted mb-12 max-w-xl mx-auto">
            Una herramienta simple y poderosa para entender cómo gastas tu
            tiempo en Steam.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" />
                </svg>
              }
              title="Sincronización"
              description="Importa tu biblioteca completa de Steam con un solo clic. Todos tus juegos y horas al instante."
            />
            <FeatureCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              }
              title="Estadísticas"
              description="Visualiza tus horas de juego con métricas claras. Descubre a qué juegas más."
            />
            <FeatureCard
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              title="Historial"
              description="Rastrea cómo evoluciona tu tiempo de juego día a día con snapshots automáticos."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Empieza a rastrear hoy
          </h2>
          <p className="text-muted">
            Crea tu cuenta en segundos, vincula tu Steam ID y sincroniza tu
            biblioteca.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto text-center text-muted text-sm">
          Steam Tracker &mdash; Hecho con Next.js y Supabase
        </div>
      </footer>
    </div>
  );
}
