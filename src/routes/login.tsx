import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, TruckIcon, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/tabelas/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { usuario, pronto, entrar } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (pronto && usuario) {
      navigate({ to: "/" });
    }
  }, [pronto, usuario, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setErro(null);
    setCarregando(true);
    const resultado = await entrar(email, senha);
    setCarregando(false);
    if (!resultado.ok) {
      setErro(resultado.erro || "Credenciais inválidas.");
    }
  }

  if (!pronto) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.72 0.13 195)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "oklch(0.66 0.16 285)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.74 0.15 155)" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.95 0.005 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.95 0.005 250) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Left panel — branding */}
      <div className="relative hidden flex-col items-center justify-center bg-card/30 px-12 backdrop-blur-sm lg:flex lg:w-[55%] border-r border-border">
        <div className="max-w-md">
          {/* Logo mark */}
          <div className="mb-8 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "oklch(0.72 0.13 195 / 0.2)", border: "1px solid oklch(0.72 0.13 195 / 0.4)" }}
            >
              <TruckIcon className="h-6 w-6" style={{ color: "oklch(0.72 0.13 195)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Sistema de Gestão
              </p>
              <h2 className="text-lg font-bold text-foreground leading-tight">KPI Fretes</h2>
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold leading-tight text-foreground">
            Controle inteligente de{" "}
            <span style={{ color: "oklch(0.72 0.13 195)" }}>custo de transporte</span>
          </h1>

          <p className="mb-10 text-base text-muted-foreground leading-relaxed">
            Analise CT-es, rotas, transportadoras e oportunidades de economia de forma centralizada e em tempo real.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { label: "Dashboard KPI em tempo real", desc: "Visão consolidada de custo e performance" },
              { label: "Análise de transportadoras", desc: "Compare fornecedores e identifique desvios" },
              { label: "Oportunidades de economia", desc: "Alertas automáticos de ineficiências" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.72 0.13 195 / 0.15)" }}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.72 0.13 195)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "oklch(0.72 0.13 195 / 0.2)", border: "1px solid oklch(0.72 0.13 195 / 0.4)" }}
            >
              <TruckIcon className="h-5 w-5" style={{ color: "oklch(0.72 0.13 195)" }} />
            </div>
            <span className="text-base font-bold text-foreground">KPI Fretes de Compras</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* E-mail field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (erro) setErro(null);
                  }}
                  placeholder="seu@email.com"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="senha" className="block text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (erro) setErro(null);
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {erro && (
              <div
                className="flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm"
                style={{
                  borderColor: "oklch(0.6 0.2 22 / 0.4)",
                  background: "oklch(0.6 0.2 22 / 0.08)",
                  color: "oklch(0.78 0.12 22)",
                }}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              id="btn-login"
              type="submit"
              disabled={carregando}
              className="relative w-full overflow-hidden rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "oklch(0.72 0.13 195)",
                color: "oklch(0.18 0.02 250)",
              }}
              onMouseEnter={(e) => {
                if (!carregando) (e.currentTarget.style.background = "oklch(0.68 0.13 195)");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.background = "oklch(0.72 0.13 195)");
              }}
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando…
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Acesso restrito a usuários autorizados.
            <br />
            Em caso de dificuldades, contate o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
