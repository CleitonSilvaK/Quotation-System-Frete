import { useState, type ReactNode } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/tabelas/auth";
import { supabaseConfigurado } from "@/lib/supabase";

export function LoginGate({ children }: { children: ReactNode }) {
  const { usuario, pronto, entrar, cadastrar } = useAuth();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  if (!pronto) {
    return (
      <div className="panel flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Carregando sessão Supabase...
      </div>
    );
  }

  if (usuario) return <>{children}</>;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      const r = modo === "entrar" ? await entrar(email, senha) : await cadastrar(nome, email, senha);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível continuar.");
      }
    } catch (err: any) {
      setErro(err.message || "Ocorreu um erro ao tentar se autenticar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={enviar} className="panel space-y-4 p-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Autenticação Supabase</h2>
            <p className="text-xs text-muted-foreground">
              {supabaseConfigurado
                ? "Acesso seguro para gestão do sistema de fretes."
                : "Configure VITE_SUPABASE_ANON_KEY no arquivo .env deste computador."}
            </p>
          </div>
        </div>

        {modo === "cadastrar" ? (
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
              disabled={carregando}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={carregando}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            disabled={carregando}
          />
        </div>

        {erro ? <p className="text-xs text-destructive">{erro}</p> : null}

        <Button type="submit" className="w-full" disabled={carregando}>
          {carregando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          {modo === "entrar" ? "Entrar com Supabase" : "Criar conta Supabase"}
        </Button>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            type="button"
            className="underline underline-offset-2"
            disabled={carregando}
            onClick={() => {
              setModo(modo === "entrar" ? "cadastrar" : "entrar");
              setErro(null);
            }}
          >
            {modo === "entrar" ? "Criar novo acesso" : "Já tenho acesso"}
          </button>
        </div>
      </form>
    </div>
  );
}
